[CmdletBinding()]
param(
    [ValidateRange(1, 10000)]
    [int]$Iterations = 25,

    [string]$Model = "gpt-5.2",

    [ValidateSet("safe", "dev", "locked")]
    [string]$AllowProfile = "safe",

    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$ProjectRoot = $PSScriptRoot
$PromptFile = Join-Path $ProjectRoot "prompts/default.txt"
$PrdFile = Join-Path $ProjectRoot "scripts/ralph/prd.json"
$ProgressFile = Join-Path $ProjectRoot "progress.txt"

foreach ($requiredFile in @($PromptFile, $PrdFile, $ProgressFile)) {
    if (-not (Test-Path -LiteralPath $requiredFile -PathType Leaf)) {
        throw "Required file missing: $requiredFile"
    }
}

# Always deny a minimal dangerous shell subset.
$denyTools = @(
    "shell(rm)",
    "shell(git push)"
)

$allowTools = @()
switch ($AllowProfile) {
    "locked" {
        $allowTools += "write"
    }
    "safe" {
        $allowTools += "write"
        $allowTools += "shell(pnpm:*)"
        $allowTools += "shell(git:*)"
    }
    "dev" {
        $allowTools += "write"
        $allowTools += "shell(pnpm:*)"
        $allowTools += "shell(git:*)"
    }
}

for ($i = 1; $i -le $Iterations; $i++) {
    Write-Host ""
    Write-Host "Iteration $i"
    Write-Host "------------------------------------"

    # Build one combined attachment file to avoid multi-@ parsing issues.
    $contextFile = Join-Path $ProjectRoot (".ralph-context.{0}.{1}.txt" -f $i, [System.Guid]::NewGuid().ToString("N"))

    try {
        $contextParts = @(
            "# Context",
            "",
            "## PRD (scripts/ralph/prd.json)",
            (Get-Content -LiteralPath $PrdFile -Raw),
            "",
            "## progress.txt",
            (Get-Content -LiteralPath $ProgressFile -Raw),
            "",
            "# Prompt",
            "",
            (Get-Content -LiteralPath $PromptFile -Raw),
            ""
        )

        [IO.File]::WriteAllText($contextFile, ($contextParts -join [Environment]::NewLine), [Text.Encoding]::UTF8)

        $copilotArgs = @(
            "--add-dir", $ProjectRoot,
            "--model", $Model,
            "--no-color",
            "--stream", "off",
            "--silent",
            "-p", "@$contextFile Follow the attached prompt."
        )

        if ($AllowProfile -eq "dev") {
            $copilotArgs += "--allow-all-tools"
        }

        foreach ($tool in $allowTools) {
            $copilotArgs += @("--allow-tool", $tool)
        }

        foreach ($tool in $denyTools) {
            $copilotArgs += @("--deny-tool", $tool)
        }

        if ($DryRun) {
            Write-Host "[DRY RUN] copilot $($copilotArgs -join ' ')"
            continue
        }

        $result = (& copilot @copilotArgs 2>&1 | Out-String)
        $status = $LASTEXITCODE

        if ($result) {
            Write-Host $result
        }

        if ($status -ne 0) {
            Write-Warning "Copilot exited with status $status; continuing to next iteration."
            continue
        }

        if ($result -match "<promise>COMPLETE</promise>") {
            Write-Host "PRD complete, exiting early."
            exit 0
        }
    }
    finally {
        if (Test-Path -LiteralPath $contextFile) {
            Remove-Item -LiteralPath $contextFile -Force -ErrorAction SilentlyContinue
        }
    }
}

Write-Host "Finished $Iterations iterations without receiving the completion signal."
