<template>
<div>
  <el-table
    :data="rawData"
    border
    class="paramTable"
    :row-class-name="setClassName">
    <el-table-column  header-align="center">
      <template slot="header">
        <span>{{$t('message.requiredTitle')}}</span>
      </template>
      <el-table-column type="expand">
        <template slot-scope="props">
          <el-form label-position="left" inline class="demo-table-expand">
            <el-form-item :label="$t('message.fileRefer')">
              <pre>{{ props.row.refer }}</pre>
            </el-form-item>
          </el-form>
        </template>
      </el-table-column>
      <el-table-column
        prop="dataName"
        :label="$t('message.dataName')"
        width="130">
      </el-table-column>
      <el-table-column
        prop="desc"
        :label="$t('message.dataDesc')">
      </el-table-column>
      <el-table-column
        :label="$t('message.dataPath')"
        width="300">
        <template slot-scope="scope">
          <el-button v-if="scope.row.dataPath != undefined" size="small"
              @click="selectPath(scope.row.dataName)"
              slot="append" icon="el-icon-folder"></el-button>
          <span v-if="scope.row.dataPath != undefined" style="margin-left: 10px">{{ scope.row.dataPath }}</span>
          <el-select v-if="scope.row.dataPath === undefined" size="small"
              v-model="scope.row.table" placeholder="Please select ...">
            <el-option
              v-for="item in wgenTables"
              :key="item"
              :label="item"
              :value="item">
            </el-option>
          </el-select>
        </template>
      </el-table-column>
    </el-table-column>
  </el-table>
  <el-table
    :data="optionalRawData"
    border
    class="paramTable"
    :row-class-name="setClassName">
    <el-table-column  header-align="center">
      <template slot="header">
        <span>{{$t('message.optionalTitle')}}</span>
      </template>
      <el-table-column type="expand">
        <template slot-scope="props">
          <el-form label-position="left" inline class="demo-table-expand">
            <el-form-item :label="$t('message.fileRefer')">
              <pre>{{ props.row.refer }}</pre>
            </el-form-item>
          </el-form>
        </template>
      </el-table-column>
      <el-table-column
        prop="dataName"
        :label="$t('message.dataName')"
        width="130">
      </el-table-column>
      <el-table-column
        prop="desc"
        :label="$t('message.dataDesc')">
      </el-table-column>
      <el-table-column
        :label="$t('message.dataPath')"
        width="300">
        <template slot-scope="scope">
          <el-button @click="selectPath(scope.row.dataName)" slot="append" size="small" icon="el-icon-folder"></el-button>
          <span style="margin-left: 10px">{{ scope.row.dataPath }}</span>
        </template>
      </el-table-column>
    </el-table-column>
  </el-table>
  
  <el-button type="text" class="mdbUrl" @click="openMDBPath()">SWAT2012.mdb</el-button>
</div>
</template>
<script>
  const {ipcRenderer} = require('electron') 
  const {shell} = require('electron')
  export default {
    props:['projInfo','rawData','optionalRawData'],
    methods: {
      selectPath(data){
        this.currentData = data
        var options = {
          title: 'Select a DEM',
          filters: [
            { name: 'Images', extensions: ['tif'] }
          ]
        }
        switch (data) {
          case 'DEM':
            options.title = 'Select DEM file'
            ipcRenderer.send('select-file-dialog',options)
            break
          case 'Outlet':
            options.title = 'Select Outlet file'
            options.filters[0] = {name:'Shapefile',extensions:['shp']}
            ipcRenderer.send('select-file-dialog',options)
            break
          case 'Landuse':
            options.title = 'Select Landuse file'
            ipcRenderer.send('select-file-dialog',options)
            break
          case 'Soil':
            options.title = 'Select Soil file'
            ipcRenderer.send('select-file-dialog',options)
            break
          case 'Landusec':
            options.title = 'Select Landuse code file'
            options.filters[0] = {name:'TXT',extensions:['txt']}
            ipcRenderer.send('select-file-dialog',options)
            break
          case 'Soilc':
            options.title = 'Select Soil code file'
            options.filters[0] = {name:'TXT',extensions:['txt']}
            ipcRenderer.send('select-file-dialog',options)
            break
          case 'Weather Stations':
            options.title = 'Select Weather Stations file'
            options.filters[0] = {name:'TXT',extensions:['txt']}
            ipcRenderer.send('select-file-dialog',options)
            break
        }
      },
      setClassName({row,index}){
        return row.refer === undefined?'no-expand':''
      },

      openMDBPath(){
        var str = this.projInfo.path + "\\" + this.projInfo.name + "\\ErrorProp\\Databases\\SWAT2012.mdb"
        shell.showItemInFolder(str)
      }
      
    },
    mounted(){
      var that = this
      ipcRenderer.on('selected-file', (event, path) => {
        if(that.currentData == "Weather Stations"){
          that.optionalRawData[0].dataPath = path[0]
          return
        }

        that.rawData.forEach(raw => {
          if(raw.dataName == that.currentData){
            raw.dataPath = path[0]
          }
        })
        that.currentData == ""
      })
    },
    data() {
      return {
        currentData: '',
        wgenTables:[
          'WGEN_user',
          'WGEN_US_FirstOrder',
          'WGEN_US_COOP_1980_2010',
          'WGEN_US_COOP_1960_2010',
          'WGEN_US_COOP_1990_2006',
          'WGEN_US_COOP_1960_1990',
        ],
      }
    }
  }
</script>

<style>
  .demo-table-expand {
    font-size: 0;
  }
  .demo-table-expand label {
    width: 90px;
    color: #99a9bf;
  }
  .demo-table-expand .el-form-item {
    margin-right: 0;
    margin-bottom: 0;
    width: 100%;
    display: inline-flex;
  }
  .el-form-item pre{
    margin-top: 6px;
    line-height: 24px;
    font-family: unset;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
  .no-expand .el-table__expand-column .cell {
    display: none;
  }
  .mdbUrl{   padding:0; float:right; margin:1% 5%;  color:#000; } 
  .mdbUrl:hover{   color: #66b1ff; }
</style>