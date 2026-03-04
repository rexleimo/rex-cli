# ContextDB transparent command wrappers for PowerShell.
# Source this file in PowerShell profile to make codex/claude/gemini auto-load context packets.
# Optional env vars:
# - ROOTPATH
# - CTXDB_SHELL_BRIDGE
# - CTXDB_RUNNER
# - CTXDB_REPO_NAME
# - CTXDB_WRAP_MODE
# - CTXDB_MARKER_FILE

$script:CTXDB_LAST_WORKSPACE = ""

function Normalize-CodexHome {
  $codexHome = $env:CODEX_HOME
  if (-not $codexHome) {
    return
  }

  # Convert relative CODEX_HOME (e.g. ".codex") to absolute user-home path.
  if (-not [System.IO.Path]::IsPathRooted($codexHome)) {
    $codexHome = Join-Path $HOME ".codex"
    $env:CODEX_HOME = $codexHome
  }

  if (-not (Test-Path $codexHome)) {
    New-Item -Path $codexHome -ItemType Directory -Force | Out-Null
  }
}

function Resolve-BridgePath {
  if ($env:CTXDB_SHELL_BRIDGE -and (Test-Path -LiteralPath $env:CTXDB_SHELL_BRIDGE)) {
    return $env:CTXDB_SHELL_BRIDGE
  }

  if ($env:ROOTPATH) {
    $candidate = Join-Path $env:ROOTPATH "scripts/contextdb-shell-bridge.mjs"
    if (Test-Path -LiteralPath $candidate) {
      return $candidate
    }
  }

  return $null
}

function Update-LastWorkspace {
  try {
    $gitRoot = (& git -C (Get-Location).Path rev-parse --show-toplevel 2>$null)
    if ($LASTEXITCODE -eq 0 -and $gitRoot) {
      $script:CTXDB_LAST_WORKSPACE = ($gitRoot | Select-Object -First 1).Trim()
    }
  } catch {
    # best effort only
  }
}

function Invoke-NativeCommand {
  param(
    [string]$Name,
    [string[]]$Arguments
  )

  $cmd = Get-Command $Name -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $cmd) {
    Write-Error "Command not found: $Name"
    return 127
  }

  & $cmd.Source @Arguments
  return $LASTEXITCODE
}

function Invoke-BridgeOrPassthrough {
  param(
    [string]$Agent,
    [string]$Passthrough,
    [string[]]$Arguments
  )

  $bridge = Resolve-BridgePath
  if (-not $bridge) {
    return (Invoke-NativeCommand -Name $Passthrough -Arguments $Arguments)
  }

  if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    return (Invoke-NativeCommand -Name $Passthrough -Arguments $Arguments)
  }

  Update-LastWorkspace
  & node $bridge "--agent" $Agent "--command" $Passthrough "--" @Arguments
  return $LASTEXITCODE
}

function codex {
  param([Parameter(ValueFromRemainingArguments = $true)] [string[]]$Args)

  Normalize-CodexHome
  $global:LASTEXITCODE = Invoke-BridgeOrPassthrough -Agent "codex-cli" -Passthrough "codex" -Arguments $Args
}

function claude {
  param([Parameter(ValueFromRemainingArguments = $true)] [string[]]$Args)

  $global:LASTEXITCODE = Invoke-BridgeOrPassthrough -Agent "claude-code" -Passthrough "claude" -Arguments $Args
}

function gemini {
  param([Parameter(ValueFromRemainingArguments = $true)] [string[]]$Args)

  $global:LASTEXITCODE = Invoke-BridgeOrPassthrough -Agent "gemini-cli" -Passthrough "gemini" -Arguments $Args
}

function aios {
  param([Parameter(ValueFromRemainingArguments = $true)] [string[]]$Args)

  $sub = if ($Args.Count -gt 0) { $Args[0] } else { "" }
  $rest = if ($Args.Count -gt 1) { $Args[1..($Args.Count - 1)] } else { @() }

  if (-not $env:ROOTPATH) {
    Write-Host "[warn] ROOTPATH is not set (install PowerShell integration first)"
    return
  }

  switch ($sub) {
    "doctor" {
      $script = Join-Path $env:ROOTPATH "scripts/verify-aios.ps1"
      if (-not (Test-Path -LiteralPath $script)) {
        Write-Host "[warn] missing verifier script: $script"
        return
      }
      & $script @rest
      $global:LASTEXITCODE = $LASTEXITCODE
      return
    }
    "update" {
      $script = Join-Path $env:ROOTPATH "scripts/update-all.ps1"
      if (-not (Test-Path -LiteralPath $script)) {
        Write-Host "[warn] missing update script: $script"
        return
      }
      & $script -Components "shell,skills" -Mode "opt-in" @rest
      $global:LASTEXITCODE = $LASTEXITCODE
      return
    }
    "" { }
    "-h" { }
    "--help" { }
    "help" { }
    default {
      Write-Host "[warn] unknown aios subcommand: $sub"
    }
  }

  Write-Host "Usage: aios <doctor|update> [args]"
  $global:LASTEXITCODE = 0
}
