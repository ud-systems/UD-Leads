@echo off
git add netlify.toml
git commit -m "Fix Netlify deployment configuration - Remove problematic redirect conditions"
git push origin main
echo Deployment triggered successfully!
pause
