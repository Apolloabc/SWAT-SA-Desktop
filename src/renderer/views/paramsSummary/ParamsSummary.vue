<template>
  <div>
    <el-table
      :data="paramsSum"
      :span-method="objectSpanMethod"
      height="650"
      class="paramTable">
      <el-table-column  header-align="center" :label="$t('message.summaryTitle')">
        <el-table-column
          prop="submodel"
          :label="$t('message.submodelColumn')"
          width="120">
        </el-table-column>
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
          :label="$t('message.statusColumn')"
          width="70">
          <template>
            <el-button size="mini" type="success" icon="el-icon-check" circle></el-button>
          </template>
        </el-table-column>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
export default {
  props:['paramsSum'],
  methods:{
    // 表格第一列 同类合并
    objectSpanMethod({ row, column, rowIndex, columnIndex }) {
      if (columnIndex === 0) {
        if (this.waterNum >0 && this.waterNum - rowIndex === this.waterNum) {
          return {
            rowspan: this.waterNum,
            colspan: 1
          };
        }else if(this.hruNum>0 && this.hruNum + this.waterNum - rowIndex === this.hruNum){
          return{
            rowspan: this.hruNum,
            colspan: 1
          }
        }else if(this.paramsSum.length - rowIndex == this.modelNum){
          return{
            rowspan: this.modelNum,
            colspan: 1
          }
        }else {
          return {
            rowspan: 0,
            colspan: 0
          };
        }
      }
    },

    // 验证用户置空输入框的情况
    validateSpace(newValue,oldValue,name,str){
      if(newValue == undefined){
        this.$message({
          message: str + ' is empty! The value before modification will be used.',
          type: 'warning'
        });
        for(var i=0; i<this.paramsSum.length; i++){
          if(this.paramsSum[i].name == name){
            this.paramsSum[i][str.toLowerCase()] = oldValue
            break
          }
        }
      }
    }
  },
  mounted(){
    this.paramsSum.forEach(param => {
      switch(param.submodel){
        case 'Watershed Delineation':
          this.waterNum++
          break
        case 'HRU Creation':
          this.hruNum++
          break
        case 'SWAT Execution':
          this.modelNum++
          break
      }
    })
  },
  data(){
    return{
      waterNum:0,
      hruNum:0,
      modelNum:0,
    }
  }
}
</script>

<style>

</style>