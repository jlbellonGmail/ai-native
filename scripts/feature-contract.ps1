$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "workunit-lib.ps1")

function Get-RepositoryRoot {
    $root = (& git rev-parse --show-toplevel) -join "`n"
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($root)) {
        throw "No pude detectar la raiz del repositorio Git."
    }

    return [System.IO.Path]::GetFullPath($root.Trim())
}

function Get-GitCommonDir {
    $commonDir = (& git rev-parse --git-common-dir) -join "`n"
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($commonDir)) {
        throw "No pude detectar el git-dir real del repositorio."
    }

    $commonDir = $commonDir.Trim()
    if (-not [System.IO.Path]::IsPathRooted($commonDir)) {
        $commonDir = Join-Path (Get-RepositoryRoot) $commonDir
    }

    $commonDir = [System.IO.Path]::GetFullPath($commonDir)
    if (-not (Test-Path -LiteralPath $commonDir -PathType Container)) {
        throw "El git-dir real no es un directorio accesible: $commonDir"
    }

    return $commonDir
}

function Get-FeatureStateDir {
    $stateDir = Join-Path (Get-GitCommonDir) "feature-reconcilers"
    if (-not (Test-Path -LiteralPath $stateDir -PathType Container)) {
        New-Item -ItemType Directory -Path $stateDir | Out-Null
    }

    return $stateDir
}

function Get-FeatureInfo {
    # Delgado sobre Get-WorkUnitInfo -Mode Feature (unica implementacion,
    # en workunit-lib.ps1). El objeto devuelto conserva las mismas
    # propiedades que siempre tuvo Get-FeatureInfo (mas algunas nuevas,
    # como Mode/Branch/Items, que no rompen consumidores existentes).
    param(
        [Parameter(Mandatory = $true)]
        [string] $Slug,

        [string] $Title = ""
    )

    return Get-WorkUnitInfo -Slug $Slug -Title $Title -Mode Feature
}

function Assert-NonEmptyFile {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Path
    )

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        throw "Falta el archivo requerido: $Path"
    }

    $content = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
    if ([string]::IsNullOrWhiteSpace($content)) {
        throw "El archivo requerido esta vacio: $Path"
    }
}

function Get-FirstExistingArtifact {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Directory,

        [Parameter(Mandatory = $true)]
        [string] $Pattern
    )

    if (-not (Test-Path -LiteralPath $Directory -PathType Container)) {
        return $null
    }

    return Get-ChildItem -LiteralPath $Directory -Filter $Pattern -File |
        Sort-Object Name |
        Select-Object -First 1
}

function Get-DocsIndexManagedRegion {
    param(
        [Parameter(Mandatory = $true)]
        [string] $IndexPath,

        [Parameter(Mandatory = $true)]
        [string] $Content
    )

    $startMarker = "<!-- FEATURE_LINKS_START -->"
    $endMarker = "<!-- FEATURE_LINKS_END -->"

    $startCount = [int] (($Content.Length - $Content.Replace($startMarker, "").Length) / $startMarker.Length)
    $endCount = [int] (($Content.Length - $Content.Replace($endMarker, "").Length) / $endMarker.Length)

    if ($startCount -ne 1) {
        throw "El indice $IndexPath debe contener exactamente un marcador $startMarker. Encontrados: $startCount."
    }

    if ($endCount -ne 1) {
        throw "El indice $IndexPath debe contener exactamente un marcador $endMarker. Encontrados: $endCount."
    }

    $startIndex = $Content.IndexOf($startMarker)
    $endIndex = $Content.IndexOf($endMarker)
    $managedStart = $startIndex + $startMarker.Length

    if ($managedStart -ge $endIndex) {
        throw "El indice $IndexPath tiene los marcadores FEATURE_LINKS en orden invalido."
    }

    return [pscustomobject]@{
        StartMarker = $startMarker
        EndMarker = $endMarker
        StartIndex = $managedStart
        EndIndex = $endIndex
        Content = $Content.Substring($managedStart, $endIndex - $managedStart)
    }
}

function Assert-IndexLink {
    param(
        [Parameter(Mandatory = $true)]
        [string] $IndexPath,

        [Parameter(Mandatory = $true)]
        [string] $TargetPath,

        [Parameter(Mandatory = $true)]
        [string] $Title
    )

    if (-not (Test-Path -LiteralPath $TargetPath -PathType Leaf)) {
        throw "No existe el destino requerido por el indice: $TargetPath"
    }

    if (-not (Test-Path -LiteralPath $IndexPath -PathType Leaf)) {
        throw "No existe el indice requerido: $IndexPath"
    }

    $targetName = Split-Path -Leaf $TargetPath
    $content = Get-Content -LiteralPath $IndexPath -Raw -Encoding UTF8
    $region = Get-DocsIndexManagedRegion -IndexPath $IndexPath -Content $content
    $escapedTarget = [regex]::Escape($targetName)
    $targetPattern = "(?m)^- \[[^\]]+\]\($escapedTarget\)\s*$"
    $targetMatches = [regex]::Matches($content, $targetPattern)

    if ($targetMatches.Count -ne 1) {
        throw "El indice $IndexPath debe contener exactamente un enlace a $targetName. Encontrados: $($targetMatches.Count)."
    }

    $managedTargetMatches = [regex]::Matches($region.Content, $targetPattern)
    if ($managedTargetMatches.Count -ne 1) {
        throw "El enlace a $targetName debe estar dentro de la zona FEATURE_LINKS de $IndexPath. Encontrados dentro de la zona: $($managedTargetMatches.Count)."
    }

    $expectedLine = "- [$Title]($targetName)"
    $escapedExpectedLine = [regex]::Escape($expectedLine)
    if ($region.Content -notmatch "(?m)^$escapedExpectedLine\s*$") {
        throw "El indice $IndexPath contiene $targetName, pero no con el enlace exacto '$expectedLine'."
    }
}

function Update-DocsIndex {
    param(
        [Parameter(Mandatory = $true)]
        [string] $IndexPath,

        [Parameter(Mandatory = $true)]
        [string] $TargetPath,

        [Parameter(Mandatory = $true)]
        [string] $Title,

        [switch] $ValidateOnly
    )

    if (-not (Test-Path -LiteralPath $TargetPath -PathType Leaf)) {
        throw "No existe el destino requerido por el indice: $TargetPath"
    }

    if (-not (Test-Path -LiteralPath $IndexPath -PathType Leaf)) {
        throw "No existe el indice requerido: $IndexPath"
    }

    $content = [System.IO.File]::ReadAllText((Resolve-Path -LiteralPath $IndexPath).Path, [System.Text.Encoding]::UTF8)
    $region = Get-DocsIndexManagedRegion -IndexPath $IndexPath -Content $content
    $targetName = Split-Path -Leaf $TargetPath
    $expectedLine = "- [$Title]($targetName)"
    $escapedTarget = [regex]::Escape($targetName)
    $targetPattern = "(?m)^- \[[^\]]+\]\($escapedTarget\)\s*$"
    $targetLines = [regex]::Matches($content, $targetPattern)
    if ($targetLines.Count -gt 1) {
        throw "Coincidencia ambigua: $IndexPath contiene mas de un enlace a $targetName."
    }

    if ($targetLines.Count -eq 1) {
        $managedTargetLines = [regex]::Matches($region.Content, $targetPattern)
        if ($managedTargetLines.Count -ne 1) {
            throw "El enlace existente a $targetName esta fuera de la zona FEATURE_LINKS de $IndexPath."
        }

        if ($targetLines[0].Value.TrimEnd() -ne $expectedLine) {
            throw "Coincidencia ambigua: $IndexPath ya enlaza $targetName con otro titulo: '$($targetLines[0].Value.Trim())'."
        }
        return $false
    }

    $escapedTitle = [regex]::Escape($Title)
    $sameTitleOtherTarget = [regex]::Matches($content, "(?m)^- \[$escapedTitle\]\((?!$escapedTarget\))[^)]+\)\s*$")
    if ($sameTitleOtherTarget.Count -gt 0) {
        throw "Coincidencia ambigua: $IndexPath ya contiene el titulo '$Title' apuntando a otro destino."
    }

    if ($ValidateOnly) {
        return $true
    }

    $newLine = if ($content.Contains("`r`n")) { "`r`n" } else { "`n" }
    $managedContent = $region.Content.TrimEnd([char[]]@("`r", "`n", " ", "`t"))
    if ([string]::IsNullOrWhiteSpace($managedContent)) {
        $updatedManagedContent = $newLine + $newLine + $expectedLine + $newLine + $newLine
    }
    else {
        $updatedManagedContent = $managedContent + $newLine + $expectedLine + $newLine + $newLine
    }

    $updatedContent = (
        $content.Substring(0, $region.StartIndex) +
        $updatedManagedContent +
        $content.Substring($region.EndIndex)
    )

    [System.IO.File]::WriteAllText(
        (Resolve-Path -LiteralPath $IndexPath).Path,
        $updatedContent,
        (New-Object System.Text.UTF8Encoding($false))
    )
    return $true
}

function New-DecisionFile {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Slug,

        [Parameter(Mandatory = $true)]
        [string] $Title,

        [Parameter(Mandatory = $true)]
        [string[]] $Decisions
    )

    $info = Get-FeatureInfo -Slug $Slug -Title $Title
    if (-not (Test-Path -LiteralPath $info.RunDir -PathType Container)) {
        New-Item -ItemType Directory -Path $info.RunDir | Out-Null
    }

    if (Test-Path -LiteralPath $info.Decision -PathType Leaf) {
        return $false
    }

    $lines = New-Object System.Collections.Generic.List[string]
    [void] $lines.Add("# Decision: $Slug - $Title")
    [void] $lines.Add("")
    [void] $lines.Add("## Estado")
    [void] $lines.Add("")
    [void] $lines.Add("MERGE aprobado por evidencias del circuito agéntico.")
    [void] $lines.Add("")
    [void] $lines.Add("## Evidencias revisadas")
    [void] $lines.Add("")
    [void] $lines.Add("- ``$($info.RunDir)/spec.md``")
    [void] $lines.Add("- ``$($info.RunDir)/audit-1.md``")
    [void] $lines.Add("- ``$($info.RunDir)/test-report-1.md``")
    [void] $lines.Add("")
    [void] $lines.Add("## Decisiones demostrables")
    [void] $lines.Add("")
    foreach ($decision in $Decisions) {
        [void] $lines.Add("- $decision")
    }
    [void] $lines.Add("")
    [void] $lines.Add("## Resultado")
    [void] $lines.Add("")
    [void] $lines.Add("La feature queda apta para integrarse/cerrarse cuando GitHub confirme merge contra ``develop`` y el cierre automatico marque ``ROADMAP.md``.")
    $content = $lines -join [Environment]::NewLine

    [System.IO.File]::WriteAllText(
        (Join-Path (Get-Location).Path $info.Decision),
        $content + [Environment]::NewLine,
        (New-Object System.Text.UTF8Encoding($false))
    )
    return $true
}

function Assert-FeatureContract {
    # Delgado sobre Assert-WorkUnitContract -Mode Feature: misma validacion
    # de siempre, unica implementacion.
    param(
        [Parameter(Mandatory = $true)]
        [string] $Slug,

        [string] $Title = "",

        [switch] $RequireReadyRoadmap
    )

    Assert-WorkUnitContract -Slug $Slug -Title $Title -Mode Feature -RequireReadyRoadmap:$RequireReadyRoadmap
}

function Assert-WorkUnitContract {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Slug,

        [ValidateSet("Feature", "Milestone")]
        [string] $Mode = "Feature",

        [string] $Title = "",

        [switch] $RequireReadyRoadmap
    )

    if ($Mode -eq "Feature") {
        $info = Get-WorkUnitInfo -Slug $Slug -Title $Title -Mode Feature
        Assert-NonEmptyFile $info.Decision
        Assert-NonEmptyFile "$($info.RunDir)/spec.md"
        Assert-NonEmptyFile $info.TechnicalDoc
        Assert-NonEmptyFile $info.UserDoc

        $audit = Get-FirstExistingArtifact -Directory $info.RunDir -Pattern "audit-*.md"
        if ($null -eq $audit) {
            throw "Falta al menos un audit-N.md en $($info.RunDir)."
        }
        Assert-NonEmptyFile $audit.FullName

        $testReport = Get-FirstExistingArtifact -Directory $info.RunDir -Pattern "test-report-*.md"
        if ($null -eq $testReport) {
            throw "Falta al menos un test-report-N.md en $($info.RunDir)."
        }
        Assert-NonEmptyFile $testReport.FullName

        Assert-IndexLink -IndexPath $info.TechnicalIndex -TargetPath $info.TechnicalDoc -Title $info.Title
        Assert-IndexLink -IndexPath $info.UserIndex -TargetPath $info.UserDoc -Title $info.Title

        if ($RequireReadyRoadmap) {
            $roadmap = Get-Content -LiteralPath "ROADMAP.md" -Raw -Encoding UTF8
            $escapedSlug = [regex]::Escape($Slug)
            $readyCount = [regex]::Matches($roadmap, "(?m)^- \[-\] $escapedSlug(?=\s|$).*").Count
            $doneCount = [regex]::Matches($roadmap, "(?m)^- \[x\] $escapedSlug(?=\s|$).*").Count
            if ($doneCount -gt 0) {
                throw "$Slug ya figura como [x]. No se puede preparar PR despues del cierre."
            }
            if ($readyCount -ne 1) {
                throw "ROADMAP.md debe contener exactamente una entrada READY_FOR_PR para $Slug. Encontradas: $readyCount."
            }
        }
        return
    }

    # Modo Milestone: un unico set de spec/decision/audit/test-report a
    # nivel de work unit, mas docs+indices por cada item individual.
    $manifestPath = "runs/milestone-$Slug/work-unit.json"
    $manifest = Read-WorkUnitManifest -Path $manifestPath
    $info = Get-WorkUnitInfo -Slug $Slug -Title $Title -Mode Milestone -Items $manifest.Items

    Assert-NonEmptyFile $info.Decision
    Assert-NonEmptyFile "$($info.RunDir)/spec.md"

    $audit = Get-FirstExistingArtifact -Directory $info.RunDir -Pattern "audit-*.md"
    if ($null -eq $audit) {
        throw "Falta al menos un audit-N.md en $($info.RunDir)."
    }
    Assert-NonEmptyFile $audit.FullName

    $testReport = Get-FirstExistingArtifact -Directory $info.RunDir -Pattern "test-report-*.md"
    if ($null -eq $testReport) {
        throw "Falta al menos un test-report-N.md en $($info.RunDir)."
    }
    Assert-NonEmptyFile $testReport.FullName

    foreach ($item in $info.Items) {
        Assert-NonEmptyFile $item.TechnicalDoc
        Assert-NonEmptyFile $item.UserDoc
        Assert-IndexLink -IndexPath $item.TechnicalIndex -TargetPath $item.TechnicalDoc -Title $item.Title
        Assert-IndexLink -IndexPath $item.UserIndex -TargetPath $item.UserDoc -Title $item.Title
    }

    if ($RequireReadyRoadmap) {
        $roadmap = Get-Content -LiteralPath "ROADMAP.md" -Raw -Encoding UTF8
        Assert-RoadmapItemsTransition -Content $roadmap -Items @($manifest.Items) -FromStates @("Ready") -ToState "verificacion-ready-for-pr"
    }
}
