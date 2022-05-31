<template>
<div>
  <el-tree :data="projTree" @node-click="changePage" default-expand-all highlight-current class="projTree">
    <span class="custom-tree-node" slot-scope="{ node, data }">
      <span>
        <i :class="data.icon"></i> {{ node.label }}
      </span>
    </span>
  </el-tree>
</div>

</template>

<script>
export default {
  name: 'Side',
  props:['projTree'],
  methods: {
    changePage(node){
      switch(node.id){
        case "configData":
          if(this.$route.name != 'RawData')
            this.$router.push({name: 'RawData'})
          break
        case "watershedParams":
          if(this.$route.name != 'WatershedParams')
            this.$router.push({name: 'WatershedParams'})
          break
        case "hruParams":
          if(this.$route.name != 'HruParams')
            this.$router.push({name: "HruParams"})
          break
        case "modelParams":
          if(this.$route.name != 'ModelParams')
            this.$router.push({name: "ModelParams"})
          break
        case 'summary':
          if(this.$route.name != 'ParamsSummary')
            this.$router.push({name:"ParamsSummary"})
          break
        case 'setting':
          if(this.$route.name != 'SimSetting')
            this.$router.push({name:'SimSetting'})
          break
        case 'execution':
          if(this.$route.name != 'Execution')
            this.$router.push({name:'Execution'})
          break
        case 'singleRun':
          if(this.$route.name != 'SingleRun')
            this.$router.push({name:'SingleRun'})
          break
        case 'simResult':
          if(this.$route.name != 'SimResult')
            this.$router.push({name:'SimResult'})
          break
        case 'saScore':
          if(this.$route.name != 'ScoreSA')
            this.$router.push({name:'ScoreSA'})
          break
        default:
          console.log(node.label)
          break
      }
    }
  },
  
}
</script>

<style>
.projTree{
  margin: 13px 8px;
}
.el-tree{
  min-width: 95% !important;
}
.custom-tree-node{
  font-family:'Times New Roman';
  font-size: 17px;
}
</style>