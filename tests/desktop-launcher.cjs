'use strict';
const {smoke}=require('../scripts/smoke-release.cjs');
smoke(process.execPath,[require('node:path').resolve(__dirname,'../desktop/main.cjs')],'development').catch(error=>{console.error(error);process.exitCode=1;});
