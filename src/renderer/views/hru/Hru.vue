<template>
  <div>
    <el-table :data="hruParams" class="paramTable">
      <el-table-column header-align="center">
        <template slot="header">
          <span>{{ $t("message.hruTitle") }}</span>
          <el-button
            size="mini"
            type="primary"
            icon="el-icon-plus"
            circle
            style="float: right; margin-right: 20px"
            @click="handleAdd()"
          ></el-button>
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
            <el-input-number
              v-model="scope.row.type.vmin"
              :placeholder="$t('message.minColumn')"
              size="small"
              @change="(currentValue, oldValue) =>validateSpace(currentValue, oldValue, scope.row.name, 'Min')"
              :precision="2"
              :step="0.1"
              controls-position="right"
              :min="scope.row.type.vminV"
              :max="scope.row.type.vmax">
            </el-input-number>
          </template>
        </el-table-column>
        <el-table-column
          prop="max"
          :label="$t('message.maxColumn')"
          width="145">
          <template slot-scope="scope">
            <!-- <el-input v-model="scope.row.max" :placeholder="$t('message.maxColumn')"></el-input> -->
            <el-input-number
              v-model="scope.row.type.vmax"
              :placeholder="$t('message.maxColumn')"
              size="small"
              @change="(currentValue, oldValue) =>validateSpace(currentValue, oldValue, scope.row.name, 'Max')"
              :precision="2"
              :step="0.1"
              controls-position="right"
              :min="scope.row.type.vmin"
              :max="scope.row.type.vmaxV">
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
              icon="el-icon-delete"
              circle
              @click="handleDelete(scope.row.name)"
            ></el-button>
          </template>
        </el-table-column>
      </el-table-column>
    </el-table>

    <!-- 选择参数的弹框 -->
    <el-dialog
      :title="$t('message.selectTitle')"
      width="650px"
      top="10vh"
      :visible.sync="selectionDialogVisible"
      class="paramDialog"
    >
      <el-transfer
        style="text-align: left !important"
        :titles="[$t('message.selectSource'), $t('message.selectTarget')]"
        v-model="value"
        :data="paramsList"
        :props="{ key: 'key', label: 'name' }"
      >
      </el-transfer>

      <div slot="footer" class="dialog-footer">
        <el-button @click="selectionDialogVisible = false">{{
          $t("message.selectCancel")
        }}</el-button>
        <el-button type="primary" @click="confirmParams">{{
          $t("message.selectConfirm")
        }}</el-button>
      </div>
    </el-dialog>
  </div>
</template>


<script>
export default {
  methods: {
    handleAdd() {
      this.selectionDialogVisible = true;
    },

    handleDelete(name) {
      for (var i = 0; i < this.selectedParams.length; i++) {
        if (this.selectedParams[i].name == name) {
          var key = this.selectedParams[i].key;
          for (var j = 0; j < this.value.length; j++) {
            if (this.value[j] == key) {
              this.value.splice(j, 1);
              break;
            }
          }
          this.selectedParams.splice(i, 1);
          break;
        }
      }
      this.$emit("updateToHruParams", this.value);
      this.$emit("updateHruParams", this.selectedParams); // 传回主页面，更新参数数组
    },

    confirmParams() {
      this.selectionDialogVisible = false;
      var params = [];
      this.value.forEach((key) => {
        for (var i = 0; i < this.paramsList.length; i++) {
          var param = this.paramsList[i];
          if (param.key == key) {
            // 保留先前的修改
            this.selectedParams.forEach((p) => {
              if (p.name == param.name) {
                param.min = p.min;
                param.max = p.max;
              }
            });
            params.push(param);
            break;
          }
        }
      });
      this.selectedParams = params;
      this.$emit("updateToHruParams", this.value);
      this.$emit("updateHruParams", this.selectedParams); // 传回主页面，更新参数数组
    },

    //验证用户置空输入框的情况
    validateSpace(newValue, oldValue, name, str) {
      if (newValue == undefined) {
        this.$message({
          message:
            str + " is empty! The value before modification will be used.",
          type: "warning",
        });
        for (var i = 0; i < this.hruParams.length; i++) {
          if (this.hruParams[i].name == name) {
            this.hruParams[i][str.toLowerCase()] = oldValue;
            break;
          }
        }
      }
    },
  },
  props: ["hruParams", "toHruParams"],
  data() {
    return {
      selectionDialogVisible: false,
      paramsList: [
        {
          submodel: "HRU Creation",
          name: "ULULC",
          key: 0,
          desc:
            "Boundary uncertainty of landuse categories, ±2000(m), if LULC is generated based on a 1km satellite image, default is 0.",
          type: {
            selected: "v__",
            options: [
              {
                value: "v__",
                label: "Replace",
              },
            ],
            vmin: -2000,
            vmax: 2000,
            vminV: -20000,
            vmaxV: 20000,
          },
          disabled: true,
        },
        {
          submodel: "HRU Creation",
          name: "USoil",
          key: 1,
          desc:
            "Boundary uncertainty of soil categories, ±2500(m), if the soil dataset at 1:5 million with the uncertainty of 0.5mm, default is 0.",
          type: {
            selected: "v__",
            options: [
              {
                value: "v__",
                label: "Replace",
              },
            ],
            vmin: -2500,
            vmax: 2500,
            vminV: -25000,
            vmaxV: 25000,
          },
          disabled: true,
        },
        {
          submodel: "HRU Creation",
          name: "MinLU",
          key: 2,
          desc:
            "Uncertainty with the minimum percentage for a landuse category in HRU, [5, 42](%), based on previous research, default is 20.",
          type: {
            selected: "v__",
            options: [
              {
                value: "v__",
                label: "Replace",
              },
            ],
            vmin: 5,
            vmax: 42,
            vminV: 5,
            vmaxV: 42,
          },
        },
        {
          submodel: "HRU Creation",
          name: "MinSoil",
          key: 3,
          desc:
            "Uncertainty with the minimum percentage for a soil category in HRU, [5, 50](%), based on previous research, default is 20.",
          type: {
            selected: "v__",
            options: [
              {
                value: "v__",
                label: "Replace",
              },
            ],
            vmin: 5,
            vmax: 50,
            vminV: 5,
            vmaxV: 50,
          },
        },
        {
          submodel: "HRU Creation",
          name: "MinSlope",
          key: 4,
          desc:
            "Uncertainty with the minimum percentage for a slope category in HRU, [5, 50](%), based on previous research, default is 20.",
          type: {
            selected: "v__",
            options: [{ value: "v__", label: "Replace" }],
            vmin: 5,
            vmax: 50,
            vminV: 5,
            vmaxV: 50,
          },
        },
        {
          submodel: "HRU Creation",
          name: "IntSlope",
          key: 5,
          desc:
            "Uncertainty with the intermediate slope percentage, [5, 80](%), based on previous research, default is 50.",
          type: {
            selected: "v__",
            options: [{ value: "v__", label: "Replace" }],
            vmin: 5,
            vmax: 80,
            vminV: 5,
            vmaxV: 80,
          },
        },
      ],
      value: [],
      selectedParams: [],
    };
  },
  mounted() {
    // 初始化已选参数，放在最下面，与js自上而下编译
    this.value = this.toHruParams;
    this.selectedParams = this.hruParams;
  },
};
</script>

<style>
</style>