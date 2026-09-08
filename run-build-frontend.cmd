@echo off
cd /d c:\laragon\www\PModular
npm run build -w frontend > fblog.txt 2>&1
echo DONE > fbdone.txt