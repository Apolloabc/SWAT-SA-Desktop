<template>
  <div>
    <el-table
      :data="modelParams"
      class="paramTable">
      <el-table-column header-align="center">
        <template slot="header">
          <span>{{$t('message.modelTitle')}}</span>
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
            <el-input v-if="scope.row.type.selected =='a__'" :placeholder="$t('message.minColumn')"  size="small"
              v-model="scope.row.type.amin"></el-input>
            <el-input v-else-if="scope.row.type.selected =='r__'" :placeholder="$t('message.minColumn')"  size="small"
              v-model="scope.row.type.rmin"></el-input>
            <el-input-number v-else v-model="scope.row.type.vmin" :placeholder="$t('message.minColumn')" size="small" 
              @change="(currentValue, oldValue) => validateSpace(currentValue, oldValue, scope.row.name, 'Min')"
              :precision="3" :step="0.1" controls-position="right" :min="scope.row.type.vminV" :max="scope.row.type.vmax">
            </el-input-number>
          </template>
        </el-table-column>
        <el-table-column
          prop="max"
          :label="$t('message.maxColumn')"
          width="145">
          <template slot-scope="scope">
            <el-input v-if="scope.row.type.selected =='a__'" :placeholder="$t('message.minColumn')"  size="small"
              v-model="scope.row.type.amax"></el-input>
            <el-input v-else-if="scope.row.type.selected =='r__'" :placeholder="$t('message.minColumn')"  size="small"
              v-model="scope.row.type.rmax"></el-input>
            <el-input-number v-else v-model="scope.row.type.vmax" :placeholder="$t('message.maxColumn')" size="small"
              @change="(currentValue, oldValue) => validateSpace(currentValue, oldValue, scope.row.name, 'Max')"
              :precision="3" :step="0.1" controls-position="right" :min="scope.row.type.vmin" :max="scope.row.type.vmaxV">
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
      <tree-transfer :title="title" :from_data='fromParams' :to_data='toParams' :defaultProps="{label:'label'}" 
        @addBtn='add' @removeBtn='remove'>
      </tree-transfer>

      <div slot="footer" class="dialog-footer">
        <el-button @click="selectionDialogVisible = false">{{$t('message.selectCancel')}}</el-button>
        <el-button type="primary" @click="confirmParams">{{$t('message.selectConfirm')}}</el-button>
      </div>
    </el-dialog>

  </div>
</template>


<script>
import treeTransfer from 'el-tree-transfer' // 引入


export default {
  components:{ treeTransfer }, // 注册
  methods: {
    handleAdd(){
      this.selectionDialogVisible = true
    },
    handleDelete(name) {
      for(var i=0; i<this.selectedParams.length; i++){
        if(this.selectedParams[i].name == name){
          
          // 删除to中对应的记录，并添加到相应的from中 --待编写
          
          this.selectedParams.splice(i,1)
          break
        }
      }
      this.$emit('updateModelParams',this.selectedParams) // 传回主页面，更新参数数组
    },
    confirmParams(){
      this.selectionDialogVisible = false
      var params = [] 
      for(var i=0; i<this.toParams.length; i++){
        var data = this.toParams[i]
        if(data.children!=undefined){
          for(var j=0; j<data.children.length; j++){
            var child = data.children[j]
            // 保留先前的修改
            this.selectedParams.forEach(p=>{
              if(p.name == child.name){
                child.type = p.type
                // child.min = p.min
                // child.max = p.max
              }
            })
            params.push(child)
          }
        }else{
          // 保留先前的修改
          this.selectedParams.forEach(p=>{
            if(p.name == data.name){
              data.type = p.type
              // data.min = p.min
              // data.max = p.max
            }
          })
          params.push(data)
        }
      }
      this.selectedParams = params

      this.$emit('updateFromToModelParams',this.fromParams,this.toParams)
      this.$emit('updateModelParams',this.selectedParams) // 传回主页面，更新参数数组
    },


    // 监听穿梭框组件添加参数
    add(fromData,toData,obj){
      this.fromParams = fromData
      this.toParams = toData
    },
    // 监听穿梭框组件移除参数
    remove(fromData,toData,obj){
      this.fromParams = fromData
      this.toParams = toData
    },
    //验证用户置空输入框的情况
    validateSpace(newValue,oldValue,name,str){
      if(newValue == undefined){
        this.$message({
          message: str + ' is empty! The value before modification will be used.',
          type: 'warning'
        });
        for(var i=0; i<this.modelParams.length; i++){
          if(this.modelParams[i].name == name){
            this.modelParams[i][str.toLowerCase()] = oldValue
            break
          }
        }
      }
    }
  },
  props:['modelParams','fromModelParams','toModelParams'],
  data(){
    return{
      selectionDialogVisible:false,
      
      value: [0,1],
      selectedParams: [],
      filterMethod(query, item) {
        return item.name.indexOf(query) > -1;
      },

      title:['Source','Target'],
      fromParams:[],
      toParams:[],

    }
  },
  mounted(){
    // 初始化已选参数，放在最下面，与js自上而下编译
    this.fromParams = this.fromModelParams
    this.toParams = this.toModelParams
    this.selectedParams = this.modelParams
  },
}
</script>

<style>

</style>