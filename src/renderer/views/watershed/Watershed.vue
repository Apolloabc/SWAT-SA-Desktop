<template>
  <div>
    <el-table
      :data="waterParams"
      class="paramTable">
      <el-table-column  header-align="center">
        <template slot="header">
          <span>{{$t('message.waterTitle')}}</span>
            <el-button
              size="mini"
              type="primary"
              icon="el-icon-plus" circle
              style="float:right;margin-right:20px"
              @click="handleAdd()"></el-button>
        </template>
        <el-table-column
          prop="name"
          :label="$t('message.paramColumn')"
          width="100">
        </el-table-column>
        <el-table-column
          prop="desc"
          :label="$t('message.descColumn')">
        </el-table-column>
        <el-table-column
          prop="type"
          :label="$t('message.operateType')"
          width="115">
          <template slot-scope="scope">
            <el-select v-model="scope.row.type.selected" size="small" >
              <el-option
                v-for="item in scope.row.type.options"
                :key="item.value"
                :label="item.label"
                :value="item.value"  style="font-family:'Times New Roman';">
              </el-option>
            </el-select>
          </template>
        </el-table-column>
        <el-table-column
          prop="min"
          :label="$t('message.minColumn')"
          width="145">
          <template slot-scope="scope">
            <!-- <el-input v-model="scope.row.min" :placeholder="$t('message.minColumn')"></el-input> -->
            <el-input-number v-model="scope.row.type.vmin" :placeholder="$t('message.minColumn')" size="small" 
              @change="(currentValue, oldValue) => validateSpace(currentValue, oldValue, scope.row.name, 'Min')"
              :precision="2" :step="10" controls-position="right" :min="scope.row.type.vminV" :max="scope.row.type.vmax">
            </el-input-number>
          </template>
        </el-table-column>
        <el-table-column
          prop="max"
          :label="$t('message.maxColumn')"
          width="145">
          <template slot-scope="scope">
            <!-- <el-input v-model="scope.row.max" :placeholder="$t('message.maxColumn')"></el-input> -->
            <el-input-number v-model="scope.row.type.vmax" :placeholder="$t('message.maxColumn')" size="small"
              @change="(currentValue, oldValue) => validateSpace(currentValue, oldValue, scope.row.name, 'Max')"
              :precision="2" :step="10" controls-position="right" :min="scope.row.type.vmin" :max="scope.row.type.vmaxV">
            </el-input-number>
          </template>
        </el-table-column>
        <el-table-column
          prop="operate"
          align="center"
          :label="$t('message.operateColumn')"
          width="90">
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="danger"
              icon="el-icon-delete" circle
              @click="handleDelete(scope.row.name)"></el-button>
          </template>
        </el-table-column>
      </el-table-column>
    </el-table>

    <!-- 选择参数的弹框 -->
    <el-dialog :title="$t('message.selectTitle')" width="650px" top="10vh"
      :visible.sync="selectionDialogVisible" class="paramDialog">
      <el-transfer
        style="text-align:left!important"
        :titles="[$t('message.selectSource'), $t('message.selectTarget')]"
        v-model="value"
        :data="paramsList"
        :props="{key:'key',label:'name'}">
      </el-transfer>

      <div slot="footer" class="dialog-footer">
        <el-button @click="selectionDialogVisible = false">{{$t('message.selectCancel')}}</el-button>
        <el-button type="primary" @click="confirmParams">{{$t('message.selectConfirm')}}</el-button>
      </div>
    </el-dialog>
  </div>
</template>


<script>

export default {
  methods: {
    handleAdd(){
      this.selectionDialogVisible = true
    },
    
    handleDelete(name) {
      for(var i=0; i<this.selectedParams.length; i++){
        if(this.selectedParams[i].name == name){
          var key = this.selectedParams[i].key
          for(var j=0; j<this.value.length; j++){
            if(this.value[j] == key){
              this.value.splice(j,1)
              break
            }
          }
          this.selectedParams.splice(i,1)
          break
        }
      }
      this.$emit('updateToWaterParams',this.value)
      this.$emit('updateWaterParams',this.selectedParams) // 传回主页面，更新参数数组
    },
    
    confirmParams(){
      this.selectionDialogVisible = false
      var params = [] 
      this.value.forEach(key => {
        for(var i=0; i<this.paramsList.length; i++){
          var param = this.paramsList[i]
          if(param.key == key){
            // 保留先前的修改
            this.selectedParams.forEach(p=>{
              if(p.name == param.name){
                param.min = p.min
                param.max = p.max
              }
            })
            params.push(param)
            break
          }
        }
      })
      this.selectedParams = params
      this.$emit('updateToWaterParams',this.value)
      this.$emit('updateWaterParams',this.selectedParams) // 传回主页面，更新参数数组
    },
    
    //验证用户置空输入框的情况
    validateSpace(newValue,oldValue,name,str){
      if(newValue == undefined){
        this.$message({
          message: str + ' is empty! The value before modification will be used.',
          type: 'warning'
        });
        for(var i=0; i<this.waterParams.length; i++){
          if(this.waterParams[i].name == name){
            this.waterParams[i][str.toLowerCase()] = oldValue
            break
          }
        }
      }
    }
  },
  props:['waterParams','toWaterParams'],
  data(){
    return{
      selectionDialogVisible:false,
      paramsList: [
        {
          submodel:'Watershed Delineation',
          name:'UDEM',
          key: 0,
          desc:'Spatially autocorrelated measurement errors of elevations.',
          min: 0,
          max: 16,
          minV: 0,
          maxV: 16,
          disabled: true,
        },{
          submodel:'Watershed Delineation',
          name:'MinStream',
          key:1,
          desc:'Uncertainty with the minimum threshold value to designate drainage to a stream, default is 5000.',
          type: {
            selected: "v__",
            options: [
              {
                value: "v__",
                label: "Replace",
              },
            ],
            vmin: 2000,
            vmax: 10000,
            vminV: 2000,
            vmaxV: 100000,
          },
        }
      ],
      value: [],
      selectedParams: [],
      
    }
  },
  mounted(){
    // 初始化已选参数，放在最下面，与js自上而下编译
    this.value = this.toWaterParams
    this.selectedParams = this.waterParams
  }
}
</script>

<style>

</style>