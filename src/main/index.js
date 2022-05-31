import { app, BrowserWindow  } from 'electron'
import { exec, execSync } from 'child_process'
import { stderr } from 'process'
import fs from 'fs'
import fxp from 'fast-xml-parser'

const {ipcMain, dialog} = require('electron')
const FileUtil = require('./utils/fileUtil')
/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, './static').replace(/\\/g, '\\\\')
}



let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow () {
  // 隐藏菜单栏
  const { Menu } = require('electron');
  Menu.setApplicationMenu(null);
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 563,
    useContentSize: true,
    width: 1000
  })
  // mainWindow.webContents.openDevTools();

  mainWindow.loadURL(winURL)

  mainWindow.on('close', function(event){
    event.preventDefault();		//如果不在弹窗之前调用一次阻止默认事件，窗口就会直接关闭；

    dialog.showMessageBox({
      type: 'info',
      title: 'Information',
      defaultId: 0,
      message: 'Are you sure to close it？',
      buttons: ["No ",'Save and Exit','Yes '] // yes 和 no 后面要加空格，否则eletron会识别成默认按钮
    },function(index){
      if(index===1) {
        event.sender.send('save-project-before-close')
      }else if(index===2){
        mainWindow = null;
        app.exit();		//exit()直接关闭客户端，不会执行quit();
      }else{
        event.preventDefault();
      }
    }) 
  });
}

app.on('ready', ()=>{
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})


  

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */



global.projectPath  = ""
global.resourcePath = process.cwd() + '\\' + __dirname + '\\resource\\'

// 选择项目目录
ipcMain.on('open-file-dialog', (event) => {
  dialog.showOpenDialog({
    properties: ['openFile', 'openDirectory']
  }, (files) => {
    if (files) {
      event.sender.send('selected-directory', files)
    }
  })
})


// 选择所需文件
ipcMain.on('select-file-dialog', (event, options) => {
  dialog.showOpenDialog(options, (file) => {
    if (file) {
      event.sender.send('selected-file', file)
    }
  })
})

// 打开项目
ipcMain.on('open-project-dialog', (event, options) => {
  dialog.showOpenDialog(options, (file) => {
    if (file) {
      global.projectPath = file[0].substring(0,file[0].lastIndexOf('\\'))
      var paramsPath = file[0].replace('swatsa','params')
      if(fs.existsSync(paramsPath)){
        // 解析swatsa文件 xml转json
        var xml = fs.readFileSync(paramsPath)
        xml = xml.toString();
        var xml2json = fxp.parse(xml);

        event.sender.send('read-swatsa-file', xml2json.parameters)
      }
      else{
        event.sender.send('read-swatsa-failed')
      }
    }
  })
})

// 选择所需文件2，不同页面返回同一个状态会出现混乱
ipcMain.on('select-file-dialog2', (event, options) => {
  dialog.showOpenDialog(options, (file) => {
    if (file) {
      event.sender.send('selected-file2', file)
    }
  })
})


// 创建项目，生成文件结构
ipcMain.on('create-new-project', (event, projInfo) => {
  global.projectPath = projInfo.path + "\\" + projInfo.name
  FileUtil.initProj(projInfo,event,()=>{
    console.log(global.initSuccess)
    if(global.initSuccess){
      event.sender.send('created-project')
    }else{
      event.sender.send('created-project-fail')
    }
  })

})


// 保存修改
ipcMain.on('save-setting',(event,totalModify)=>{
  // 复制TxtInOut文件夹
  FileUtil.copyTxtInOut(totalModify.projInfo)
  // 复制原始数据
  FileUtil.copyRawData(totalModify.rawData,totalModify.optionalRawData)
  // 生成参数文件
  FileUtil.saveParams(totalModify.paramsSum)
  // 生成设置文件
  var observedInfo = FileUtil.saveSetting(totalModify.simSetting, totalModify.observedInfo, totalModify.projInfo)
  // 定时任务，检查文件是否复制完成
  var check = setInterval(()=>{
    var flag = FileUtil.checkState(totalModify.projInfo,totalModify.rawData,totalModify.optionalRawData)
    if(flag){
      clearInterval(check)
      event.sender.send('setting-saved', observedInfo)
    }
  },2000)
  
})


// 保存项目
ipcMain.on('save-project',(event,totalModify)=>{

  // 保存本次项目参数，以便下次打开
  var name = totalModify.projInfo.name
  var path = totalModify.projInfo.path
  var projPath = path + "\\" + name
  var filePath = projPath + "\\" + name + ".params"
  var fileContent ={
    parameters:totalModify
  }
  fs.writeFile(filePath, new fxp.j2xParser({format: true}).parse(fileContent))
  event.sender.send('project-saved')
})


// 保存项目并退出
ipcMain.on('save-project-exit',(event,totalModify)=>{

  // 保存本次项目参数，以便下次打开
  var name = totalModify.projInfo.name
  var path = totalModify.projInfo.path
  var projPath = path + "\\" + name
  var filePath = projPath + "\\" + name + ".params"
  var fileContent ={
    parameters:totalModify
  }
  fs.writeFile(filePath, new fxp.j2xParser({format: true}).parse(fileContent))
  
  mainWindow = null;
  app.exit();		//exit()直接关闭客户端，不会执行quit();
})


// 进行采样
ipcMain.on('start-sampling',(event, saMethod)=>{
  if(!fs.existsSync(global.projectPath+'\\paramsSum.txt')){
    event.sender.send('sample-fail')
  }else{
    var sample = FileUtil.paramsSampling(saMethod)
    if(sample == -1){
      event.sender.send('sample-failed')
    }else{
      event.sender.send('sample-success',sample)
    }
  }
})


// 开始运行模拟
ipcMain.on('start-running',(event,number,preExe)=>{
  // 调用R脚本，生成采样文件 F:\\SWAT\\cg\\params_sampling.csv
  console.log(number)

  exec("RScript "+global.projectPath+"\\execute_model.R "+ global.projectPath+"\\ "+number+" "+__static+"\\ "+preExe,(err,stdout,stderr)=>{
    if(err){
      console.log(err)
      event.sender.send('run-failed',err)
      return
    }

    event.sender.send('run-success')
  })

  //test
  // event.sender.send('run-success')
})


// 开始单次运行模拟
ipcMain.on('start-single-run',(event,singleParamsSet,preExe)=>{
  if(!fs.existsSync(global.projectPath+'\\paramsSum.txt')){     
    event.sender.send('single-run-denied')   
  }else{
    // 保存本次参数
    var filePath = global.projectPath + "\\single_params.csv"
    var paramNameStr = ''
    var paramValueStr = ''
    for(var i=0; i<singleParamsSet.length; i++){

      var param = singleParamsSet[i]

      if(param.type.selected == 'v__'){
        paramNameStr += 'v__' + param.name + ','
        paramValueStr += param.type.vvalue + ','
      }else if(param.type.selected == 'a__'){
        paramNameStr += 'a__' + param.name + ','
        paramValueStr += param.type.avalue + ','
      }else{
        paramNameStr += 'r__' + param.name + ','
        paramValueStr += param.type.rvalue + ','
      }

    }
    var singleParamStr = paramNameStr + '\n' + paramValueStr + '\n'
    fs.writeFile(filePath, singleParamStr);

    // 调用脚本
    exec("RScript "+global.projectPath+"\\execute_single_model.R "+ global.projectPath+"\\ "+__static+"\\ "+preExe,(err,stdout,stderr)=>{
      if(err){
        console.log(err)
        event.sender.send('single-run-failed', err)
        return
      }
      event.sender.send('single-run-success')
    })
  }

})



// 运行结束，计算敏感性得分
ipcMain.on('compute-SA',(event,targets,saMethod)=>{
  var score = FileUtil.computeSA(targets,saMethod)
  if(score == -1){
    event.sender.send('compute-SA-failed')
  }else{
    event.sender.send('compute-SA-success',score)
  }
  
})


// 读取模拟结果
ipcMain.on('get-simulation-result',(event,targets)=>{
  var simResult = FileUtil.getSimResult(targets)
  if(simResult == -1){
    event.sender.send('simulation-result-failed')
  }else{
    event.sender.send('simulation-result',simResult)
  }
  
})


// 读取单次模拟结果
ipcMain.on('get-single-sim-result',(event,targets)=>{
  var singleSimResult = FileUtil.getSingleSimResult(targets)
  event.sender.send('single-simulation-result',singleSimResult)
})


// 计算目标函数
ipcMain.on('compute-objective',(event,objective,observedInfo)=>{
  var observedInfo = FileUtil.computeObj(objective,observedInfo)
  if(observedInfo == -1){
    event.sender.send('compute-obj-failed')
  }else{
    event.sender.send('compute-obj-success',observedInfo)
  }
})


// 单次运行计算目标函数
ipcMain.on('single-compute-objective',(event,objective,observedInfo)=>{
  var observedInfo = FileUtil.singleComputeObj(objective,observedInfo)
  event.sender.send('single-compute-obj-success',observedInfo)
})


// 重采样时，清空模拟结果
ipcMain.on('re-delete-simResult',(event,targets)=>{
  FileUtil.delSimResult(targets)
})

// 清空模拟结果
ipcMain.on('delete-simResult',(event,targets)=>{
  var isDel = FileUtil.delSimResult(targets)
  event.sender.send('delete-simResult-success')
})