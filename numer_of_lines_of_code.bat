@echo off
REM Usage: numer_of_lines_of_code.bat [path]
REM If path not provided, current directory is used.
setlocal EnableDelayedExpansion

rem --- root directory (optional first argument) ---
set "root=%~1"
if "%root%"=="" set "root=%cd%"

pushd "%root%" >nul 2>&1 || (
  echo Error: cannot access "%root%"
  exit /b 1
)

rem --- counters ---
set /a jsFiles=0, jsLines=0
set /a htmlFiles=0, htmlLines=0
set /a cssFiles=0, cssLines=0

rem --- helper to count files/lines only under src directory ---
if not exist "src\" (
  echo Pozor: adresar "src" nenalezen v %root%. Nulove statistiky.
) else (
  rem We use nested FOR to run: find /v /c "" < "file" which returns a single number.
  for /R "src" %%F in (*.js) do (
    set /a jsFiles+=1
    for /f %%N in ('find /v /c "" ^< "%%~fF"') do set /a jsLines+=%%N
  )
  for /R "src" %%F in (*.html) do (
    set /a htmlFiles+=1
    for /f %%N in ('find /v /c "" ^< "%%~fF"') do set /a htmlLines+=%%N
  )
  for /R "src" %%F in (*.css) do (
    set /a cssFiles+=1
    for /f %%N in ('find /v /c "" ^< "%%~fF"') do set /a cssLines+=%%N
  )
)

set /a totalFiles = jsFiles + htmlFiles + cssFiles
set /a totalLines = jsLines + htmlLines + cssLines

rem --- column widths ---
set /a COL1=8    & rem file type (left)
set /a COL2=6    & rem files count (right)
set /a COL3=12   & rem lines count (right)

rem a string of spaces used for padding (must be >= max column width)
set "SPACES=                                        "  & rem 40 spaces

rem --- print table ---
echo.
echo Statistiky po typu souboru (pracovni adresar: %root%)
echo.
rem header with aligned columns
call :padRight "Type" %COL1% h1
call :padLeft "Files" %COL2% h2
call :padLeft "Lines" %COL3% h3
echo %h1% ^| %h2% ^| %h3%

rem print separator line matching total width
set /a totalWidth = COL1 + 3 + COL2 + 3 + COL3
set "sep="
for /L %%i in (1,1,%totalWidth%) do set "sep=%sep%-"
echo %sep%

call :printRow ".js"    %jsFiles%    %jsLines%
call :printRow ".html"  %htmlFiles%  %htmlLines%
call :printRow ".css"   %cssFiles%   %cssLines%

echo %sep%
call :printRow "TOTAL"  %totalFiles%  %totalLines%
echo.

popd >nul 2>&1
endlocal
exit /b 0

:printRow
REM args: %1 = label, %2 = files, %3 = lines
set "label=%~1"
set "files=%~2"
set "lines=%~3"
call :padRight "%label%" %COL1% labelP
call :padLeft "%files%" %COL2% filesP
call :padLeft "%lines%" %COL3% linesP
echo %labelP% ^| %filesP% ^| %linesP%
exit /b

:padRight
REM args: %1 text, %2 width, returns var name in %3
set "txt=%~1"
set /a width=%~2
set "res=%txt%%SPACES%"
REM take leftmost 'width' chars, use CALL to defer expansion so substring is evaluated at runtime
call set "%~3=%%res:~0,%width%%%"
exit /b

:padLeft
REM args: %1 text, %2 width, returns var name in %3
set "txt=%~1"
set /a width=%~2
set "res=%SPACES%%txt%"
REM take rightmost 'width' chars (negative start) using CALL to defer expansion
call set "%~3=%%res:~-%width%%%"
exit /b
