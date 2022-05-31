<template>
<el-card class="new-card" shadow="always">
  <el-form :model="projInfo" status-icon :rules="rules" ref="projInfo" label-width="100px" class="new-form">
    <el-form-item :label="$t('message.projName')" prop="name">
      <el-input v-model="projInfo.name"></el-input>
    </el-form-item>
    <el-form-item :label="$t('message.projPath')" prop="path">
      <el-input v-model="projInfo.path">
         <el-button @click="selectPath('pPath')" slot="append" icon="el-icon-folder"></el-button>
      </el-input>
    </el-form-item>
    <el-form-item :label="$t('message.projDesc')">
      <el-input v-model="projInfo.desc"></el-input>
    </el-form-item>
    <el-form-item :label="$t('message.projType')">
      <el-radio-group v-model="projInfo.type">
        <el-radio :label="0">{{$t('message.projTxtInOut')}}</el-radio>
        <el-radio :label="1">{{$t('message.projRawData')}}</el-radio>
      </el-radio-group>
    </el-form-item>

    <!-- 观测数据的Form -->
    <!-- <el-form label-width="100px" v-if="projInfo.type == 0" status-icon :rules="rules"> -->
      <el-divider  v-if="projInfo.type == 0">{{$t('message.splitLineTxtInOut')}}</el-divider>
      <el-form-item  v-if="projInfo.type == 0" :label="$t('message.TxtInOutPath')" prop="tioPath">
        <el-input v-model="projInfo.tioPath">
          <el-button @click="selectPath('tPath')" slot="append" icon="el-icon-folder"></el-button>
        </el-input>
      </el-form-item>
    <!-- </el-form> -->
    <!-- <el-form-item>
    </el-form-item> -->
  </el-form>
  <div style="text-align:center">
    <el-button type="primary" @click="newProj">{{$t('message.createBtn')}}</el-button>
    <!-- <el-button>{{$t('message.resetBtn')}}</el-button> -->
  </div>
</el-card>
</template>

<script>
const {ipcRenderer} = require('electron')

export default {
  props:['projInfo'],
  methods: {
    selectPath(data){
      this.currentData = data
      ipcRenderer.send('open-file-dialog')
    },
    newProj(){
      this.$refs.projInfo.validate((valid) =>{
        console.log(valid)
        if(valid){
          ipcRenderer.send('create-new-project',this.projInfo)
        }
        
      })
    },
    
  },
  mounted(){
    var that = this
    // js的回调监听功能好奇怪，成功一次，会触发多次回调
    ipcRenderer.on('selected-directory', (event, path) => {
      if(that.currentData == 'pPath'){
        that.projInfo.path = path[0]
        // 清空，防止多次回调造成的混淆
        that.currentData = ''
      }else if(that.currentData == 'tPath'){
        that.projInfo.tioPath = path[0]
        that.currentData = ''
      }
    }),
    ipcRenderer.on('created-project', () => {
      that.$emit('createdSuccess')
    })
    ipcRenderer.on('created-project-fail', ()=>{
      console.log("创建失败")
    })
  },
  data() {
    var checkName = (rule, value, callback) => {
      if(!value){
        return callback(new Error('Please enter a project name'))
      }else{
        callback()
      }
    }
    var checkPath = (rule, value, callback) => {
      if(!value){
        return callback(new Error('Please select the project path'))
      }else{
        callback()
      }
    }
    var checkTxtInOutPath = (rule, value, callback) => {
      if(!value){
        return callback(new Error('Please select the TxtInOut path'))
      }else{
        callback()
      }
    }
    return {
      currentData:'',
      rules:{
        name:[
          {validator: checkName, trigger: 'blur'}
        ],
        path:[
          {validator: checkPath, trigger: 'blur'}
        ],
        tioPath:[
          {validator: checkTxtInOutPath, trigger: 'blur'}
        ]
      }
    }
  }
}
</script>

<style>
.new-card{
  width: 60%;
  margin: auto;
  font-family:'Times New Roman';
}
.new-form{
  margin: 0 10%;
}
</style>