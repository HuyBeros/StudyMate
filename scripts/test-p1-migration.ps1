param([string]$PgBin = 'F:\postgresql\bin')
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
& (Join-Path $PSScriptRoot 'setup-p1-test-db.ps1') -PgBin $PgBin
$dbName = 'studymate_p1_migration_' + [guid]::NewGuid().ToString('N').Substring(0,8)
if ($dbName -notmatch '^studymate_p1_migration_[a-f0-9]{8}$') { throw 'Invalid disposable database name' }
$psql = Join-Path $PgBin 'psql.exe'
$argsDb = @('-h','127.0.0.1','-p','55438','-U','studymate_p1','-v','ON_ERROR_STOP=1','-d',$dbName)
function CheckExit { if ($LASTEXITCODE -ne 0) { throw "PostgreSQL command failed ($LASTEXITCODE)" } }
& (Join-Path $PgBin 'createdb.exe') -h 127.0.0.1 -p 55438 -U studymate_p1 $dbName
CheckExit
try {
    & $psql @argsDb -f (Join-Path $projectRoot 'src/test/resources/db/p1-legacy-schema.sql') *> $null
    CheckExit
    & $psql @argsDb -f (Join-Path $projectRoot 'src/test/resources/db/p1-migration-seed.sql')
    CheckExit
    $migration = Join-Path $projectRoot 'src/main/resources/db/migration_003_study_foundation.sql'
    & $psql @argsDb -f $migration *> $null
    if ($LASTEXITCODE -eq 0) { throw 'Migration must refuse a missing legacy timezone' }
    $before = & $psql @argsDb -tAc "SELECT count(*) FROM information_schema.columns WHERE table_name='task' AND column_name='public_id'"
    CheckExit
    if ($before.Trim() -ne '0') { throw 'Failed migration was not rolled back' }
    & $psql @argsDb -c "SET studymate.legacy_timezone='Asia/Ho_Chi_Minh'" -f $migration *> $null
    CheckExit
    & $psql @argsDb -c "UPDATE task_completion_event SET revoked_at=now() WHERE task_public_id=(SELECT public_id FROM task WHERE id=1)"
    CheckExit
    & $psql @argsDb -c "SET studymate.legacy_timezone='Asia/Ho_Chi_Minh'" -f $migration *> $null
    CheckExit
    & $psql @argsDb -f (Join-Path $projectRoot 'src/test/resources/db/p1-migration-assert.sql')
    CheckExit
    Write-Output 'PASS: migration rollback, legacy timezone, missing/deleted completion, rerun and revoked history.'
} finally {
    # Only the disposable database created above; never the application or integration database.
    & (Join-Path $PgBin 'dropdb.exe') -h 127.0.0.1 -p 55438 -U studymate_p1 $dbName
    CheckExit
}
