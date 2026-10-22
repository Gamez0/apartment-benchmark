const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({
  testDir:'tests/browser',fullyParallel:true,forbidOnly:!!process.env.CI,
  retries:0,workers:process.env.CI?3:2,timeout:45000,
  reporter:[['list'],['html',{open:'never'}]],
  use:{baseURL:'http://127.0.0.1:4173',trace:'retain-on-failure',screenshot:'only-on-failure'},
  projects:[
    {name:'desktop-chromium',use:{browserName:'chromium',viewport:{width:1280,height:900}}},
    {name:'mobile-chromium-320',use:{browserName:'chromium',viewport:{width:320,height:800},isMobile:true,hasTouch:true}},
    {name:'mobile-webkit-390',use:{browserName:'webkit',viewport:{width:390,height:844},isMobile:true,hasTouch:true}},
  ],
  webServer:{command:'node tests/server.cjs',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI},
});
