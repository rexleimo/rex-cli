param(
  [Parameter(Position = 0)]
  [string]$Command,
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Args
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ScriptDir = $PSScriptRoot
$RootDir = (Resolve-Path (Join-Path $ScriptDir '..')).Path

function Show-Usage {
  @"
AIOS unified entry (TUI + wrapper)

Usage:
  powershell -ExecutionPolicy Bypass -File .\scripts\aios.ps1
  powershell -ExecutionPolicy Bypass -File .\scripts\aios.ps1 <cmd> [--] [args]

Commands:
  setup       -> scripts/setup-all.ps1
  update      -> scripts/update-all.ps1
  uninstall   -> scripts/uninstall-all.ps1
  doctor      -> scripts/verify-aios.ps1

Examples:
  .\scripts\aios.ps1 setup -- -Components all -Mode opt-in
  .\scripts\aios.ps1 update -- -Components shell,skills -SkipDoctor
  .\scripts\aios.ps1 doctor -- -Strict
"@ | Write-Host
}

function Invoke-Wrapped {
  param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('setup', 'update', 'uninstall', 'doctor')]
    [string]$Cmd,
    [string[]]$Rest = @()
  )

  $scriptPath = switch ($Cmd) {
    'setup' { Join-Path $ScriptDir 'setup-all.ps1' }
    'update' { Join-Path $ScriptDir 'update-all.ps1' }
    'uninstall' { Join-Path $ScriptDir 'uninstall-all.ps1' }
    'doctor' { Join-Path $ScriptDir 'verify-aios.ps1' }
  }

  if ($Rest.Count -gt 0 -and $Rest[0] -eq '--') {
    $Rest = if ($Rest.Count -gt 1) { $Rest[1..($Rest.Count - 1)] } else { @() }
  }

  $rendered = if ($Rest.Count -gt 0) { "$scriptPath $($Rest -join ' ')" } else { $scriptPath }
  Write-Host "+ $rendered"
  & $scriptPath @Rest
  exit $LASTEXITCODE
}

if ($Command) {
  switch ($Command) {
    { $_ -in @('-h', '--help', 'help') } {
      Show-Usage
      exit 0
    }
    { $_ -in @('setup', 'update', 'uninstall', 'doctor') } {
      Invoke-Wrapped -Cmd $Command -Rest $Args
      exit $LASTEXITCODE
    }
    default {
      Write-Host "Unknown command: $Command"
      Show-Usage
      exit 1
    }
  }
}

try {
  [void][Console]::KeyAvailable
} catch {
  Write-Host "[warn] interactive TUI requires a console"
  Show-Usage
  exit 1
}

$ModeOptions = @('all', 'repo-only', 'opt-in', 'off')
$ClientOptions = @('all', 'codex', 'claude', 'gemini', 'opencode')

[int]$ModeIdx = 2
[int]$ClientIdx = 0

$CompBrowser = $true
$CompShell = $true
$CompSkills = $true
$CompSuperpowers = $true

$SetupSkipPlaywright = $false
$SetupSkipDoctor = $false

$UpdateWithPlaywright = $false
$UpdateSkipDoctor = $false

$UninstallBrowser = $false
$UninstallShell = $true
$UninstallSkills = $true
$UninstallSuperpowers = $false

$DoctorStrict = $false
$DoctorGlobalSecurity = $false

$screen = 'main'
[int]$cursor = 0
$confirmAction = ''

$origCursorVisible = [Console]::CursorVisible

function Cleanup-Tui {
  [Console]::CursorVisible = $origCursorVisible
}

function Join-SetupComponents {
  $parts = @()
  if ($CompBrowser) { $parts += 'browser' }
  if ($CompShell) { $parts += 'shell' }
  if ($CompSkills) { $parts += 'skills' }
  if ($CompSuperpowers) { $parts += 'superpowers' }
  return ($parts -join ',')
}

function Join-UninstallComponents {
  $parts = @()
  if ($UninstallBrowser) { $parts += 'browser' }
  if ($UninstallShell) { $parts += 'shell' }
  if ($UninstallSkills) { $parts += 'skills' }
  if ($UninstallSuperpowers) { $parts += 'superpowers' }
  return ($parts -join ',')
}

function Ensure-AnySetupComponent {
  if (-not ($CompBrowser -or $CompShell -or $CompSkills -or $CompSuperpowers)) {
    $CompShell = $true
  }
}

function Ensure-AnyUninstallComponent {
  if (-not ($UninstallBrowser -or $UninstallShell -or $UninstallSkills -or $UninstallSuperpowers)) {
    $UninstallShell = $true
  }
}

function Build-CommandDisplay {
  param([string]$Action)

  $mode = $ModeOptions[$ModeIdx]
  $client = $ClientOptions[$ClientIdx]

  switch ($Action) {
    'setup' {
      $comps = Join-SetupComponents
      $cmd = @('scripts/setup-all.ps1', '-Components', $comps, '-Mode', $mode, '-Client', $client)
      if ($SetupSkipPlaywright) { $cmd += '-SkipPlaywrightInstall' }
      if ($SetupSkipDoctor) { $cmd += '-SkipDoctor' }
      return ($cmd -join ' ')
    }
    'update' {
      $comps = Join-SetupComponents
      $cmd = @('scripts/update-all.ps1', '-Components', $comps, '-Mode', $mode, '-Client', $client)
      if ($UpdateWithPlaywright) { $cmd += '-WithPlaywrightInstall' }
      if ($UpdateSkipDoctor) { $cmd += '-SkipDoctor' }
      return ($cmd -join ' ')
    }
    'uninstall' {
      $comps = Join-UninstallComponents
      $cmd = @('scripts/uninstall-all.ps1', '-Components', $comps, '-Client', $client)
      return ($cmd -join ' ')
    }
    'doctor' {
      $cmd = @('scripts/verify-aios.ps1')
      if ($DoctorStrict) { $cmd += '-Strict' }
      if ($DoctorGlobalSecurity) { $cmd += '-GlobalSecurity' }
      return ($cmd -join ' ')
    }
  }
}

function Render-Header {
  Write-Host 'AIOS — Unified Entry (TUI)'
  Write-Host ("Repo: {0}" -f $RootDir)
  Write-Host 'Use ↑/↓ to navigate, SPACE to toggle, ENTER to confirm, B to back, Q to quit'
  Write-Host ''
}

function Render-Item {
  param(
    [string]$Label,
    [bool]$Active
  )
  if ($Active) {
    Write-Host ("▸ {0}" -f $Label)
  } else {
    Write-Host ("  {0}" -f $Label)
  }
}

function Render-Checkbox {
  param(
    [string]$Label,
    [bool]$Checked,
    [bool]$Active
  )

  $mark = if ($Checked) { '[x]' } else { '[ ]' }
  if ($Active) {
    Write-Host ("▸ {0} {1}" -f $mark, $Label)
  } else {
    Write-Host ("  {0} {1}" -f $mark, $Label)
  }
}

function Render-Cycle {
  param(
    [string]$Label,
    [string]$Value,
    [bool]$Active
  )
  if ($Active) {
    Write-Host ("▸ {0}: {1}" -f $Label, $Value)
  } else {
    Write-Host ("  {0}: {1}" -f $Label, $Value)
  }
}

function Leave-Tui {
  Cleanup-Tui
  Clear-Host
}

function Enter-Tui {
  [Console]::CursorVisible = $false
}

function Wait-ForEnter {
  Write-Host ''
  Write-Host 'Press Enter to return to menu...'
  while ($true) {
    $k = [Console]::ReadKey($true)
    if ($k.Key -eq 'Enter') { break }
  }
}

function Invoke-Action {
  param([string]$Action)

  $mode = $ModeOptions[$ModeIdx]
  $client = $ClientOptions[$ClientIdx]

  Leave-Tui

  $status = 0
  try {
    switch ($Action) {
      'setup' {
        $comps = Join-SetupComponents
        $params = @{ Components = $comps; Mode = $mode; Client = $client }
        if ($SetupSkipPlaywright) { $params.SkipPlaywrightInstall = $true }
        if ($SetupSkipDoctor) { $params.SkipDoctor = $true }
        Write-Host ('+ scripts/setup-all.ps1 ' + ($params.GetEnumerator() | ForEach-Object { "-$($_.Key) $($_.Value)" } | Out-String).Trim())
        & (Join-Path $ScriptDir 'setup-all.ps1') @params
        $status = $LASTEXITCODE
      }
      'update' {
        $comps = Join-SetupComponents
        $params = @{ Components = $comps; Mode = $mode; Client = $client }
        if ($UpdateWithPlaywright) { $params.WithPlaywrightInstall = $true }
        if ($UpdateSkipDoctor) { $params.SkipDoctor = $true }
        Write-Host ('+ scripts/update-all.ps1 ' + ($params.GetEnumerator() | ForEach-Object { "-$($_.Key) $($_.Value)" } | Out-String).Trim())
        & (Join-Path $ScriptDir 'update-all.ps1') @params
        $status = $LASTEXITCODE
      }
      'uninstall' {
        $comps = Join-UninstallComponents
        $params = @{ Components = $comps; Client = $client }
        Write-Host ('+ scripts/uninstall-all.ps1 ' + ($params.GetEnumerator() | ForEach-Object { "-$($_.Key) $($_.Value)" } | Out-String).Trim())
        & (Join-Path $ScriptDir 'uninstall-all.ps1') @params
        $status = $LASTEXITCODE
      }
      'doctor' {
        $params = @{}
        if ($DoctorStrict) { $params.Strict = $true }
        if ($DoctorGlobalSecurity) { $params.GlobalSecurity = $true }
        Write-Host '+ scripts/verify-aios.ps1'
        & (Join-Path $ScriptDir 'verify-aios.ps1') @params
        $status = $LASTEXITCODE
      }
    }
  } catch {
    Write-Host "[fail] exception: $($_.Exception.Message)"
    $status = 1
  }

  Write-Host ''
  if ($status -eq 0) {
    Write-Host '[ok] exit code: 0'
  } else {
    Write-Host ("[fail] exit code: {0}" -f $status)
  }

  Wait-ForEnter
  Enter-Tui
}

  try {
    Enter-Tui

  :MainLoop while ($true) {
    Clear-Host
    Render-Header

    switch ($screen) {
      'main' {
        $items = @('Setup', 'Update', 'Uninstall', 'Doctor', 'Exit')
        for ($i = 0; $i -lt $items.Count; $i++) {
          Render-Item -Label $items[$i] -Active ($i -eq $cursor)
        }
      }
      'setup' {
        Write-Host 'Setup (wraps scripts/setup-all.ps1)'
        Write-Host ''
        Render-Checkbox -Label 'browser' -Checked $CompBrowser -Active ($cursor -eq 0)
        Render-Checkbox -Label 'shell' -Checked $CompShell -Active ($cursor -eq 1)
        Render-Checkbox -Label 'skills' -Checked $CompSkills -Active ($cursor -eq 2)
        Render-Checkbox -Label 'superpowers' -Checked $CompSuperpowers -Active ($cursor -eq 3)
        Render-Cycle -Label 'mode' -Value $ModeOptions[$ModeIdx] -Active ($cursor -eq 4)
        Render-Cycle -Label 'client' -Value $ClientOptions[$ClientIdx] -Active ($cursor -eq 5)
        Render-Checkbox -Label 'skip playwright install' -Checked $SetupSkipPlaywright -Active ($cursor -eq 6)
        Render-Checkbox -Label 'skip doctor' -Checked $SetupSkipDoctor -Active ($cursor -eq 7)
        Render-Item -Label 'Continue' -Active ($cursor -eq 8)
        Render-Item -Label 'Back' -Active ($cursor -eq 9)
      }
      'update' {
        Write-Host 'Update (wraps scripts/update-all.ps1)'
        Write-Host ''
        Render-Checkbox -Label 'browser' -Checked $CompBrowser -Active ($cursor -eq 0)
        Render-Checkbox -Label 'shell' -Checked $CompShell -Active ($cursor -eq 1)
        Render-Checkbox -Label 'skills' -Checked $CompSkills -Active ($cursor -eq 2)
        Render-Checkbox -Label 'superpowers' -Checked $CompSuperpowers -Active ($cursor -eq 3)
        Render-Cycle -Label 'mode' -Value $ModeOptions[$ModeIdx] -Active ($cursor -eq 4)
        Render-Cycle -Label 'client' -Value $ClientOptions[$ClientIdx] -Active ($cursor -eq 5)
        Render-Checkbox -Label 'with playwright install' -Checked $UpdateWithPlaywright -Active ($cursor -eq 6)
        Render-Checkbox -Label 'skip doctor' -Checked $UpdateSkipDoctor -Active ($cursor -eq 7)
        Render-Item -Label 'Continue' -Active ($cursor -eq 8)
        Render-Item -Label 'Back' -Active ($cursor -eq 9)
      }
      'uninstall' {
        Write-Host 'Uninstall (wraps scripts/uninstall-all.ps1)'
        Write-Host 'Note: browser/superpowers have no destructive auto-uninstall by default.'
        Write-Host ''
        Render-Checkbox -Label 'browser' -Checked $UninstallBrowser -Active ($cursor -eq 0)
        Render-Checkbox -Label 'shell' -Checked $UninstallShell -Active ($cursor -eq 1)
        Render-Checkbox -Label 'skills' -Checked $UninstallSkills -Active ($cursor -eq 2)
        Render-Checkbox -Label 'superpowers' -Checked $UninstallSuperpowers -Active ($cursor -eq 3)
        Render-Cycle -Label 'client' -Value $ClientOptions[$ClientIdx] -Active ($cursor -eq 4)
        Render-Item -Label 'Continue' -Active ($cursor -eq 5)
        Render-Item -Label 'Back' -Active ($cursor -eq 6)
      }
      'doctor' {
        Write-Host 'Doctor (wraps scripts/verify-aios.ps1)'
        Write-Host ''
        Render-Checkbox -Label 'strict' -Checked $DoctorStrict -Active ($cursor -eq 0)
        Render-Checkbox -Label 'global security scan' -Checked $DoctorGlobalSecurity -Active ($cursor -eq 1)
        Render-Item -Label 'Continue' -Active ($cursor -eq 2)
        Render-Item -Label 'Back' -Active ($cursor -eq 3)
      }
      'confirm' {
        Write-Host 'Confirm'
        Write-Host ''
        Write-Host 'Command:'
        Write-Host (Build-CommandDisplay -Action $confirmAction)
        Write-Host ''
        Render-Item -Label 'Run' -Active ($cursor -eq 0)
        Render-Item -Label 'Back' -Active ($cursor -eq 1)
      }
    }

    $key = [Console]::ReadKey($true)

    if ($key.KeyChar -in @('q', 'Q')) {
      break MainLoop
    }

    if ($key.KeyChar -in @('b', 'B')) {
      switch ($screen) {
        'main' { }
        'setup' { $screen = 'main'; $cursor = 0 }
        'update' { $screen = 'main'; $cursor = 0 }
        'uninstall' { $screen = 'main'; $cursor = 0 }
        'doctor' { $screen = 'main'; $cursor = 0 }
        'confirm' { $screen = $confirmAction; $cursor = 0 }
      }
      continue
    }

    if ($key.Key -eq 'UpArrow') { $cursor-- }
    if ($key.Key -eq 'DownArrow') { $cursor++ }

    switch ($screen) {
      'main' {
        if ($cursor -lt 0) { $cursor = 4 }
        if ($cursor -gt 4) { $cursor = 0 }
        if ($key.Key -eq 'Enter') {
          switch ($cursor) {
            0 { $screen = 'setup'; $cursor = 0 }
            1 { $screen = 'update'; $cursor = 0 }
            2 { $screen = 'uninstall'; $cursor = 0 }
            3 { $screen = 'doctor'; $cursor = 0 }
            4 { break MainLoop }
          }
        }
      }
      'setup' {
        if ($cursor -lt 0) { $cursor = 9 }
        if ($cursor -gt 9) { $cursor = 0 }
        if ($key.Key -eq 'Spacebar') {
          switch ($cursor) {
            0 { $CompBrowser = -not $CompBrowser }
            1 { $CompShell = -not $CompShell }
            2 { $CompSkills = -not $CompSkills }
            3 { $CompSuperpowers = -not $CompSuperpowers }
            4 { $ModeIdx = ($ModeIdx + 1) % $ModeOptions.Count }
            5 { $ClientIdx = ($ClientIdx + 1) % $ClientOptions.Count }
            6 { $SetupSkipPlaywright = -not $SetupSkipPlaywright }
            7 { $SetupSkipDoctor = -not $SetupSkipDoctor }
          }
          Ensure-AnySetupComponent
        }
        if ($key.Key -eq 'Enter') {
          switch ($cursor) {
            8 { $confirmAction = 'setup'; $screen = 'confirm'; $cursor = 0 }
            9 { $screen = 'main'; $cursor = 0 }
          }
        }
      }
      'update' {
        if ($cursor -lt 0) { $cursor = 9 }
        if ($cursor -gt 9) { $cursor = 0 }
        if ($key.Key -eq 'Spacebar') {
          switch ($cursor) {
            0 { $CompBrowser = -not $CompBrowser }
            1 { $CompShell = -not $CompShell }
            2 { $CompSkills = -not $CompSkills }
            3 { $CompSuperpowers = -not $CompSuperpowers }
            4 { $ModeIdx = ($ModeIdx + 1) % $ModeOptions.Count }
            5 { $ClientIdx = ($ClientIdx + 1) % $ClientOptions.Count }
            6 { $UpdateWithPlaywright = -not $UpdateWithPlaywright }
            7 { $UpdateSkipDoctor = -not $UpdateSkipDoctor }
          }
          Ensure-AnySetupComponent
        }
        if ($key.Key -eq 'Enter') {
          switch ($cursor) {
            8 { $confirmAction = 'update'; $screen = 'confirm'; $cursor = 0 }
            9 { $screen = 'main'; $cursor = 0 }
          }
        }
      }
      'uninstall' {
        if ($cursor -lt 0) { $cursor = 6 }
        if ($cursor -gt 6) { $cursor = 0 }
        if ($key.Key -eq 'Spacebar') {
          switch ($cursor) {
            0 { $UninstallBrowser = -not $UninstallBrowser }
            1 { $UninstallShell = -not $UninstallShell }
            2 { $UninstallSkills = -not $UninstallSkills }
            3 { $UninstallSuperpowers = -not $UninstallSuperpowers }
            4 { $ClientIdx = ($ClientIdx + 1) % $ClientOptions.Count }
          }
          Ensure-AnyUninstallComponent
        }
        if ($key.Key -eq 'Enter') {
          switch ($cursor) {
            5 { $confirmAction = 'uninstall'; $screen = 'confirm'; $cursor = 0 }
            6 { $screen = 'main'; $cursor = 0 }
          }
        }
      }
      'doctor' {
        if ($cursor -lt 0) { $cursor = 3 }
        if ($cursor -gt 3) { $cursor = 0 }
        if ($key.Key -eq 'Spacebar') {
          switch ($cursor) {
            0 { $DoctorStrict = -not $DoctorStrict }
            1 { $DoctorGlobalSecurity = -not $DoctorGlobalSecurity }
          }
        }
        if ($key.Key -eq 'Enter') {
          switch ($cursor) {
            2 { $confirmAction = 'doctor'; $screen = 'confirm'; $cursor = 0 }
            3 { $screen = 'main'; $cursor = 0 }
          }
        }
      }
      'confirm' {
        if ($cursor -lt 0) { $cursor = 1 }
        if ($cursor -gt 1) { $cursor = 0 }
        if ($key.Key -eq 'Enter') {
          switch ($cursor) {
            0 {
              Invoke-Action -Action $confirmAction
              $screen = 'main'
              $cursor = 0
            }
            1 { $screen = $confirmAction; $cursor = 0 }
          }
        }
      }
    }
  }
} finally {
  Cleanup-Tui
  Clear-Host
}
