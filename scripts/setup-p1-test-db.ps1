param([string]$PgBin = 'F:\postgresql\bin')
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$cluster = [IO.Path]::GetFullPath((Join-Path $projectRoot 'target/p1-postgres'))
if (-not $cluster.StartsWith($projectRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Invalid test cluster path' }
$psql = Join-Path $PgBin 'psql.exe'
$pgctl = Join-Path $PgBin 'pg_ctl.exe'
function CheckExit { if ($LASTEXITCODE -ne 0) { throw "PostgreSQL command failed ($LASTEXITCODE)" } }
New-Item -ItemType Directory -Path (Split-Path $cluster) -Force | Out-Null
if (-not (Test-Path -LiteralPath (Join-Path $cluster 'PG_VERSION'))) {
    & (Join-Path $PgBin 'initdb.exe') -D $cluster -A trust -U studymate_p1 --no-locale -E UTF8
    CheckExit
}
& $pgctl -D $cluster status *> $null
if ($LASTEXITCODE -ne 0) {
    $log = Join-Path $projectRoot 'target/p1-postgres.log'
    $startArgs = @('-D', ('"' + $cluster + '"'), '-l', ('"' + $log + '"'), '-o', '"-p 55438 -h 127.0.0.1"', '-w', 'start')
    $starter = Start-Process -FilePath $pgctl -ArgumentList $startArgs -WindowStyle Hidden -PassThru `
        -RedirectStandardOutput (Join-Path $projectRoot 'target/p1-pgctl-out.log') `
        -RedirectStandardError (Join-Path $projectRoot 'target/p1-pgctl-error.log')
    # Wait for pg_ctl only. PostgreSQL itself is expected to keep running.
    if (-not $starter.WaitForExit(20000) -or $starter.ExitCode -ne 0) { throw "Test PostgreSQL did not start. See $log" }
}
$dbArgs = @('-h','127.0.0.1','-p','55438','-U','studymate_p1','-w','-X','-v','ON_ERROR_STOP=1')
$actualDirectory = & $psql @dbArgs -d postgres -tAc 'SHOW data_directory'
CheckExit
if ([IO.Path]::GetFullPath($actualDirectory.Trim()) -ne $cluster) { throw 'Port 55438 belongs to a different PostgreSQL cluster' }
$exists = & $psql @dbArgs -d postgres -tAc "SELECT count(*) FROM pg_database WHERE datname='studymate_p1_test'"
CheckExit
if ($exists.Trim() -eq '0') {
    & (Join-Path $PgBin 'createdb.exe') -h 127.0.0.1 -p 55438 -U studymate_p1 studymate_p1_test
    CheckExit
    # Schema-only fixture: no production records, credentials, or network connection.
    & $psql @dbArgs -d studymate_p1_test -f (Join-Path $projectRoot 'src/test/resources/db/p1-legacy-schema.sql')
    CheckExit
}
& $psql @dbArgs -d studymate_p1_test -c "SET studymate.legacy_timezone='Asia/Ho_Chi_Minh'" -f (Join-Path $projectRoot 'src/main/resources/db/migration_003_study_foundation.sql')
CheckExit
& $psql @dbArgs -d studymate_p1_test -f (Join-Path $projectRoot 'src/main/resources/db/migration_004_username_login.sql')
CheckExit
& $psql @dbArgs -d studymate_p1_test -f (Join-Path $projectRoot 'src/main/resources/db/migration_005_study_rooms.sql')
CheckExit
Write-Output 'P1 test DB ready: 127.0.0.1:55438/studymate_p1_test (synthetic data only).'
