<template>
  <div>
    <el-transfer
      filterable
      :filter-method="filterMethod"
      filter-placeholder="请输入参数名"
      v-model="selectedParams"
      :data="paramsList"
      :titles="['Source', 'Target']"
      :props="{label:'name'}">
    </el-transfer>
    <el-button @click="selectionDialogVisible = false">取 消</el-button>
    <el-button type="primary" @click="confirmSelect">确 定</el-button>
  </div>
</template>

<script>
export default {
  name:'ParamSelection',
  props:['paramsList','selectionDialogVisible'],
  methods:{
    confirmSelect(){
      console.log(this.selectedParams)
      this.$emit('confirmParams',this.selectedParams)
    }
  },
  data() {
    return {
      selectedParams:[],
      filterMethod(query, item) {
        return item.label.indexOf(query) > -1;
      }
    };
  }
}
</script>

<style>

</style>