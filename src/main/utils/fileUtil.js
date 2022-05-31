
import fs from 'fs'
import readline from 'readline'
import fxp from 'fast-xml-parser'
import { exec, execSync } from 'child_process'

const { dialog } = require('electron')

const copyDir = function(src,dst,callback){
  //测试某个路径下文件是否存在
  fs.exists(dst,function(exists){
      if(exists){//不存在
          callback(src,dst);
      }else{//存在
          fs.mkdir(dst,function(){//创建目录
              callback(src,dst)
          })
      }
  })
}
const deleteAll = function(path){
  var files = [];
  if(fs.existsSync(path)) {
    console.log("开始删除")
    files = fs.readdirSync(path);
    files.forEach(function(file, index) {
      var curPath = path + "/" + file;
      if(fs.statSync(curPath).isDirectory()) { // recurse
        deleteAll(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
    console.log("删除完毕")
  }
}
const copy = function(src,dst){
  fs.readdir(src,function(err,paths){
    if(err){
      throw err
    }
    paths.forEach(function(path){
      var _src=src+'\\'+path
      var _dst=dst+'\\'+path
      fs.stat(_src,function(err,st){
        if(err){
            throw err
        }
        if(st.isFile()){
          fs.copyFile(_src,_dst,function(err){
            if(err) console.log(err+" ---- "+_src+" ---- "+_dst + " copy failed")
          })
        }else if(st.isDirectory()){
          copyDir(_src,_dst,copy)
        }
      })
    })
  })
}
const convertToTable = function (data) {
  data = data.toString();
  var table = new Array();
  var rows = new Array();
  rows = data.split("\r\n");
  for (var i = 0; i < rows.length; i++) {
      table.push(rows[i].split(/,| +/));
  }
  return table
}

// 检查数据是否Copy完成
export function checkState(projInfo,rawData,optionalRawData){
  var name = projInfo.name
  var path = projInfo.path

  var projPath = path + "\\" + name

  // 复制TxtInOut文件夹  true Raw Data; false TxtInOut
  if(projInfo.type == 0){
    var tioPath = projPath + "\\xgeswat\\Scenarios\\Default\\TxtInOut"
    var snum = fs.readdirSync(projInfo.tioPath).length
    var tnum1 = fs.readdirSync(tioPath).length
    var tnum2 = fs.readdirSync(tioPath+"\\Backup").length
    console.log("Copy Percent of TxtInOut:",snum,tnum1,tnum2)
    if(tnum1 >= snum && tnum2 >= snum){
      return true
    }else{
      return false
    }
  }else{
    var flag = true
    rawData.forEach(raw => {
      if(raw.dataPath != ''){
        switch (raw.dataName) {
          case 'DEM':
          case 'Landuse':
          case 'Soil':
            var suffix = raw.dataPath.substring(raw.dataPath.lastIndexOf('.'),)
            var ex1 = fs.existsSync(global.projectPath + "\\xgeswat\\Source\\" + raw.alias + suffix)
            var ex2 = fs.existsSync(global.projectPath + "\\xgeswat\\Source\\original\\" + raw.alias + suffix)
            console.log("Copy Percent of Raw data:",ex1,ex2)
            if(!(ex1 && ex2)){
              flag = false
            }
            break
        }
      }
    });
    return flag
  }
}

// 初始化新项目
export function initProj(projInfo,event,callback){
  var name = projInfo.name
  var path = projInfo.path

  var projPath = path + "\\" + name
  if(fs.existsSync(projPath)){
    const options = {
      type: 'info',
      title: 'Warning',
      message: "The folder already exists, is it overwritten",
      buttons: ['Yes', 'No']
    }

    dialog.showMessageBox(options, (index) => {
      if(index == 0){
        deleteAll(projPath)
        fs.mkdirSync(projPath)

        // var emptyPath = global.resourcePath + 'EmptyProject'
        var emptyPath = __static + '\\EmptyProject'
        copy(emptyPath,projPath)

        if(projInfo.type == 1){
          fs.mkdirSync(projPath+ '\\ErrorProp')
          var ErrorPath = __static + '\\ErrorProp'
          copy(ErrorPath,projPath + '\\ErrorProp')
        }

        var filePath = projPath + "\\" + name + ".swatsa"
        var fileContent = {
          project:{
            name: name,
            path: projPath,
            desc: projInfo.desc,
            type: projInfo.type==1 ? 'Based on Raw Data':'Based on TxtInOut',
            TxtInOut: projInfo.tioPath,
            createTime: new Date().getTime()
          }
        }
        
        fs.writeFileSync(filePath, new fxp.j2xParser({format: true}).parse(fileContent))
        global.initSuccess = true
        callback(event)
      }else{
        global.initSuccess = false
        callback(event)
      }
    })
  } else {
    fs.mkdirSync(projPath)

    // var emptyPath = global.resourcePath + 'EmptyProject'
    var emptyPath = __static + '\\EmptyProject'
    copy(emptyPath,projPath)
    
    if(projInfo.type == 1){
      fs.mkdirSync(projPath+ '\\ErrorProp')
      var ErrorPath = __static + '\\ErrorProp'
      copy(ErrorPath,projPath + '\\ErrorProp')
    }
    

    var filePath = projPath + "\\" + name + ".swatsa"
    
    var fileContent = {
      project:{
        name: name,
        path: projPath,
        desc: projInfo.desc,
        type: projInfo.type==1 ? 'Based on Raw Data':'Based on TxtInOut',
        TxtInOut: projInfo.tioPath,
        createTime: new Date().getTime()
      }
    }
    fs.writeFileSync(filePath, new fxp.j2xParser({format: true}).parse(fileContent))
    global.initSuccess = true
    // 复制TxtInOut文件夹  不能在这里复制，因为空项目是异步创建的，在这里复制会找不到文件夹
    callback(event)
  }
}

export function copyTxtInOut(projInfo){
  var name = projInfo.name
  var path = projInfo.path

  var projPath = path + "\\" + name

  // 复制TxtInOut文件夹  true Raw Data; false TxtInOut
  if(projInfo.type == 0){
    var tioPath = projPath + "\\xgeswat\\Scenarios\\Default\\TxtInOut"
  
    copy(projInfo.tioPath,tioPath)
    copy(projInfo.tioPath,tioPath+"\\Backup")
  }
}

// copy原始数据
export function copyRawData(rawData, optionalRawData){
  rawData.forEach(raw => {
    if(raw.dataPath != ''){
      switch (raw.dataName) {
        case 'DEM':
        case 'Landuse':
        case 'Soil':
          var suffix = raw.dataPath.substring(raw.dataPath.lastIndexOf('.'),)
          fs.copyFileSync(raw.dataPath, global.projectPath + "\\xgeswat\\Source\\" + raw.alias + suffix)
          fs.copyFileSync(raw.dataPath, global.projectPath + "\\xgeswat\\Source\\original\\" + raw.alias + suffix)
          break
        case 'Outlet':
          var outletParent = raw.dataPath.substring(0, raw.dataPath.lastIndexOf('\\'))
          fs.readdir(outletParent,function(err,paths){
            paths.forEach(function(path){
              if(path.substring(0,path.lastIndexOf('.')) == raw.dataPath.substring(raw.dataPath.lastIndexOf('\\')+1, raw.dataPath.lastIndexOf('.')) ){
                var _src=outletParent + '\\' + path
                var suffix = path.substring(path.lastIndexOf('.'),)
                var _dst=global.projectPath + "\\xgeswat\\Source\\" + raw.alias + suffix
                fs.stat(_src,function(err,st){
                  if(err){
                      throw err
                  }
                  if(st.isFile()){
                    fs.copyFileSync(_src,_dst)
                  }
                })
              }
            })
          })
          break
        case 'Landusec':
        case 'Soilc':
          var suffix = raw.dataPath.substring(raw.dataPath.lastIndexOf('.'),)
          fs.copyFileSync(raw.dataPath, global.projectPath + "\\xgeswat\\Source\\" + raw.alias + suffix)
          break
        case 'Weather Generator':
          var table = raw.table
          fs.writeFileSync( global.projectPath + "\\WGEN_Table.txt",table)
          break
      }
    }
  });
  if(optionalRawData[0].dataPath != ''){
    var stations = optionalRawData[0].dataPath
    var suffix = stations.substring(stations.lastIndexOf('.'),)
    fs.copyFileSync(stations, global.projectPath + "\\xgeswat\\Source\\" + optionalRawData[0].alias + suffix)

    const rl = readline.createInterface({
      input: fs.createReadStream(stations)
    });

    rl.on('line', (line) => {
      if(line != ''){
        var num = line.split(/ +|\t/)[0]
        console.log(num)

        var stationsParent = stations.substring(0, stations.lastIndexOf('\\'))
        fs.readdir(stationsParent,function(err,paths){
          paths.forEach(function(path){
            if(path.substring(0,path.lastIndexOf('.')) == num ){
              var _src=stationsParent + '\\' + path
              var _dst=global.projectPath + "\\xgeswat\\Source\\" + path
              fs.stat(_src,function(err,st){
                if(err){
                    throw err
                }
                if(st.isFile()){
                  fs.copyFileSync(_src,_dst)
                }
              })

              // pcp
              var suffix = path.substring(path.lastIndexOf('.')+1,)
              if(suffix == 'pcp' ){
                fs.copyFileSync(_src, global.projectPath + "\\xgeswat\\Source\\original\\" + num + 'ori.' + suffix)
              }
            }
          })
        })

      }
    });
  }
}

// 生成参数文件
export function saveParams(paramsSum){
  var filePath = global.projectPath + "\\paramsSum.txt"
  var str = ''
  paramsSum.forEach(param => {
    if(param.type.selected == 'v__'){
      str += param.name + ":" + param.type.vmin + "," + param.type.vmax + ",v__" + "\n"
    }else if(param.type.selected == 'a__'){
      str += param.name + ":" + param.type.amin + "," + param.type.amax + ",a__" + "\n"
    }else{
      str += param.name + ":" + param.type.rmin + "," + param.type.rmax + ",r__" + "\n"
    }
  })
  fs.writeFileSync(filePath, str)
}

// 生成设置文件
export function saveSetting(simSetting, observedInfo, projInfo){
  // 处理水文站点数据或者所在流域id文件 如果没有上传水文站数据，默认结果是最后一个子流域 XXX 
  // 上面这句话不合理，还是需要用户指定这流域出口
  // if(simSetting.observed){
    // true raw data shp点数据； false TxtInOut 流域id文件
    if(projInfo.type==1){
      var stationParent = simSetting.waterStationShp.substring(0, simSetting.waterStationShp.lastIndexOf('\\'))
      fs.readdir(stationParent,function(err,paths){
        paths.forEach(function(path){
          if(path.substring(0,path.lastIndexOf('.')) == simSetting.waterStationShp.substring(simSetting.waterStationShp.lastIndexOf('\\')+1, simSetting.waterStationShp.lastIndexOf('.')) ){
            var _src=stationParent + '\\' + path
            var suffix = path.substring(path.lastIndexOf('.'),)
            var _dst=global.projectPath + "\\xgeswat\\Source\\WaterStations" + suffix
            fs.stat(_src,function(err,st){
              if(err){
                  throw err
              }
              if(st.isFile()){
                fs.copyFileSync(_src,_dst)
              }
            })
          }
        })
      })
    }else{
      var suffix = simSetting.basinTxt.substring(simSetting.basinTxt.lastIndexOf('.'),)
      fs.copyFileSync(simSetting.basinTxt, global.projectPath + "\\basinID" + suffix)
    }
  // }

  // 处理观测数据
  var obsNames = ''
  if(simSetting.observed){
    observedInfo.forEach(obs => {
      if(obs.path != ""){
        obsNames += obs.name
        // 复制
        fs.copyFileSync( obs.path,global.projectPath + "\\obs_"+ obs.name + ".txt")

        // 读取
        var data = fs.readFileSync(obs.path)
        data = data.toString();
        var obsArr = data.split("\r\n")
        obsArr.splice(0,1)
        if(obsArr[obsArr.length-1] == "") obsArr.splice(obsArr.length-1,1)
        obs.data = obsArr
      }
    })
  }

  // 生成Setting文件
  var filePath = global.projectPath + "\\simSetting.txt"
  var method = ""
  if(simSetting.saMethod == 0)  method = "eFAST"
  else if(simSetting.saMethod == 1) method = "morris"
  else if(simSetting.saMethod == 2) method = "sobol"
  else if(simSetting.saMethod == 3) method = "fast"
  var str = "simRange" + ":" + simSetting.simRange.join(',') + "\n"
  str += "simTimes" + ":" + simSetting.simTimes + "\n"
  str += "simTargets" + ":" + simSetting.simTargets.join(",") + "\n"
  str += "SAmethod:" + method + "\n"
  str += "timeStep" + ":" + simSetting.timeStep + "\n"
  str += "objective" + ":" + simSetting.objective.join(",") + "\n"
  str += "observation" + ":" + obsNames + "\n"
  fs.writeFileSync(filePath, str)
  return observedInfo
}

// 调用脚本进行采样，并读取样本文件，返回
export function paramsSampling(saMethod){
  if(saMethod == 0){
    // eFAST,调用R脚本，生成采样文件 F:\\SWAT\\cg\\params_sampling.csv
    // RScript params_sampling.R 1
    execSync("RScript "+global.projectPath+"\\params_sampling.R "+ global.projectPath)
  }else{
    // 其余三种方法，调用python脚本
    execSync("python "+global.projectPath+"\\params_sampling.py "+ global.projectPath+"\\")
  }

  // 读取样本文件
  if(!fs.existsSync(global.projectPath+'\\params_sampling.csv')){
    return -1
  }else{
    var data = fs.readFileSync(global.projectPath+'\\params_sampling.csv')
    var table = convertToTable(data)
    return table
  }
  // var data = fs.readFileSync(global.projectPath+'\\params_sampling.csv')
  // var table = convertToTable(data)
  // return table
}

// 调用脚本计算敏感性得分，并读取得分文件，返回
export function computeSA(targets,saMethod){
  if(saMethod == 0){
    // eFAST, 调用R脚本
    execSync("RScript "+global.projectPath+"\\SA_compute.R "+ global.projectPath+"\\")
  }else{
    // 其余三种方法，调用python脚本
    execSync("python "+global.projectPath+"\\SA_compute.py "+ global.projectPath+"\\")
  }
  // 读取得分文件
  var fileName = ''
  var score = {}
  targets.forEach(target => {
    fileName = 'SA_score_'+target+'.csv'
    if(!fs.existsSync(global.projectPath+'\\'+fileName)){
      return -1
    }
    var data = fs.readFileSync(global.projectPath+'\\'+fileName)
    var sc = convertToTable(data)
    score[target] = sc
  });
  return score
}

// 读取模拟结果文件，并返回
export function getSimResult(targets){
  var fileName = ''
  var simResult = {}
  targets.forEach(target => {
    fileName = 'sim_result_'+target+'.dat'
    if(!fs.existsSync(global.projectPath+'\\'+fileName)){
      return -1
    }
    var data = fs.readFileSync(global.projectPath+'\\'+fileName)
    var res = convertToTable(data)
    simResult[target] = res
  });
  return simResult
}

// 读取单次模拟结果文件，并返回
export function getSingleSimResult(targets){
  var fileName = ''
  var singleSimResult = {}
  targets.forEach(target => {
    fileName = 'single_sim_result_'+target+'.dat'
    var data = fs.readFileSync(global.projectPath+'\\'+fileName)
    data = data.toString();
    var resArr = data.split(/ +/)
    if(resArr[resArr.length-1] == "") resArr.splice(resArr.length-1,1)
    singleSimResult[target] = resArr
  });
  // Landeuse贡献率
  var pie = {}
  fileName = 'Landuse_TN.csv'
  var data = fs.readFileSync(global.projectPath+'\\'+fileName)
  var table = convertToTable(data)
  var landuse = []
  table[0].forEach(la =>{
    landuse.push(la.replace(/"/g,''))
  })
  pie.landuse = landuse
  pie.TN = table[1]

  fileName = 'Landuse_TP.csv'
  data = fs.readFileSync(global.projectPath+'\\'+fileName)
  table = convertToTable(data)   
  pie.TP = table[1]

  singleSimResult.pieResult = pie 
  return singleSimResult
}

// 调用脚本计算目标函数，并读取得分文件，返回
export function computeObj(objective,observedInfo){
  execSync("RScript "+global.projectPath+"\\obj_compute.R "+ global.projectPath+"\\")
  // 读取得分文件
  var fileName = ''
  objective.forEach(obj => {
    for(var i=0; i<observedInfo.length; i++){
      if(observedInfo[i].path != ''){
        // 读取
        fileName = obj+'_'+observedInfo[i].name+'.dat'
        if(!fs.existsSync(global.projectPath+'\\'+fileName)){
          return -1
        }
        var data = fs.readFileSync(global.projectPath+'\\'+fileName)

        data = data.toString();
        var sc = data.split("\r\n")

        observedInfo[i].obj[obj] = sc
      }
    }
  });
  return observedInfo
}


// 调用脚本计算 单次运行 目标函数，并读取得分文件，返回
export function singleComputeObj(objective,observedInfo){
  
  execSync("RScript "+global.projectPath+"\\obj_single_compute.R "+ global.projectPath+"\\")
  // 读取得分文件
  var fileName = ''
  objective.forEach(obj => {
    for(var i=0; i<observedInfo.length; i++){
      if(observedInfo[i].path != ''){
        // 读取
        fileName = obj+'_single_'+observedInfo[i].name+'.dat'
        var data = fs.readFileSync(global.projectPath+'\\'+fileName)

        data = data.toString();

        observedInfo[i].obj[obj] = data
      }
    }
  });
  return observedInfo
}


// 清空模拟结果
export function delSimResult(targets){
  var fileName = ''
  targets.forEach(target => {
    fileName = 'sim_result_'+target+'.dat'
    if(fs.existsSync(global.projectPath+'\\'+fileName))
      fs.unlinkSync(global.projectPath+'\\'+fileName)
  });
  fileName = global.projectPath+'\\'+'res_basin.dat'
  if(fs.existsSync(fileName))
    fs.unlinkSync(fileName)
  fileName = global.projectPath+'\\'+'res_hru.dat'
  if(fs.existsSync(fileName))
    fs.unlinkSync(fileName)
  fileName = global.projectPath+'\\'+'res_output.dat'
  if(fs.existsSync(fileName))
    fs.unlinkSync(fileName)
  fileName = global.projectPath+'\\'+'res_total_output.dat'
  if(fs.existsSync(fileName))
    fs.unlinkSync(fileName)
  return true
}