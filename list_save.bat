@echo off
dir /b /s /a-d | findstr /v /i /c:"\.git\\" /c:"\icons\\" > list.txt
echo Listing complete. Output saved to list.txt