<template>
  <el-container>
    <el-header>
      <div>
        <img :src="ogmsUrl" @click="openOpenGMSHome" class="OpenGMS-image" />
        <el-button @click="newProj" type="text" class="topMenu">
          <i class="el-icon-folder-add"></i> {{ $t("message.newProj") }}
        </el-button>
        <el-button @click="openProj" type="text" class="topMenu">
          <i class="el-icon-folder-opened"></i>{{ $t("message.openProj") }}
        </el-button>
        <el-button @click="saveDialogVisible = true" type="text" class="topMenu">
          <i class="el-icon-folder-checked"></i>{{ $t("message.saveProj") }}
        </el-button>
        <el-button @click="welcome" type="text" class="topMenu">
          <i class="el-icon-info"></i> {{ $t("message.welcome") }}
        </el-button>
        <el-select
          v-model="lang"
          @change="switchLang"
          style="width: 105px; float: right">
          <el-option
            v-for="item in langOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value">
          </el-option>
        </el-select>
      </div>
    </el-header>
    <el-container>
      <el-aside width="240px" v-show="($route.name != 'NewProj' && $route.name != 'Welcome') || projTree.length != 1">
        <side :projTree="projTree" />
      </el-aside>
      <el-main>
        <router-view
          :projInfo="projInfo"
          @createdSuccess="createNewProj"
          :rawData="rawData"
          :optionalRawData="optionalRawData"
          :waterParams="waterParams"
          :hruParams="hruParams"
          :modelParams="modelParams"
          @updateWaterParams="updateWaterParams"
          @updateHruParams="updateHruParams"
          @updateModelParams="updateModelParams"
          :paramsSum="paramsSum"
          :toWaterParams="toWaterParams"
          @updateToWaterParams="updateToWaterParams"
          :toHruParams="toHruParams"
          @updateToHruParams="updateToHruParams"
          :fromModelParams="fromModelParams"
          :toModelParams="toModelParams"
          @updateFromToModelParams="updateFromToModelParams"
          :simSetting="simSetting"
          :observedInfo.sync="observedInfo"
          :paramsSample.sync="paramsSample"
          :activeStep.sync="activeStep"
          :runningTip="runningTip"
          @getObjScore="getObjScore"
          @getScoreSA="getScoreSA"
          :scoreSA="scoreSA"
          :simResult="simResult"
          @getSimResult="getSimResult"
          :calibrationResult="calibrationResult"
        />
      </el-main>
    </el-container>

    <el-dialog
      :title="$t('message.saveTitle')"
      :visible.sync="saveDialogVisible"
      width="30%"
      center
      style="font-family: 'Times New Roman'"
    >
      <!-- <el-radio-group v-model="saveType" > -->
      <el-radio v-model="saveType" class="save-radio" :label="0">{{$t("message.saveSetting")}}</el-radio><br />
      <el-radio v-model="saveType" class="save-radio" :label="1">{{$t("message.saveProject")}}</el-radio><br />
      <!-- </el-radio-group> -->
      <span slot="footer" class="dialog-footer">
        <el-button @click="saveDialogVisible = false" size="medium ">{{$t("message.selectCancel")}}</el-button>
        <el-button type="primary" @click="saveSettingOrProj" size="medium ">{{$t("message.selectConfirm")}}</el-button>
      </span>
    </el-dialog>
  </el-container>
</template>

<script>
import Side from "../side/Side";
const { ipcRenderer, TouchBarButton } = require("electron");
const { shell } = require("electron");
var saveLoading
export default {
  name: "Layout",

  components: { Side },

  methods: {
    switchLang() {
      this.$i18n.locale = this.lang;
      console.log(this.rawData);
    },
    newProj() {
      if (this.$route.name != "NewProj") this.$router.push({ name: "NewProj" });
    },
    openOpenGMSHome() {
      shell.openExternal("http://geomodeling.njnu.edu.cn/home");
    },
    welcome() {
      if (this.$route.name != "Welcome") this.$router.push({ name: "Welcome" });
    },
    openProj() {
      var options = {
        title: "Select a SWAT-SA project",
        filters: [{ name: "SWAT-SA", extensions: ["swatsa"] }],
      };
      if (this.projTree.length > 1) {
        this.$confirm(
          this.$t("message.openMessage"),
          this.$t("message.openTitle"),
          {
            confirmButtonText: this.$t("message.selectConfirm"),
            cancelButtonText: this.$t("message.selectCancel"),
            type: "warning",
            center: true,
          }
        )
          .then(() => {
            this.saveType = 1;
            this.saveSettingOrProj();
            ipcRenderer.send("open-project-dialog", options);
          })
          .catch(() => {
            ipcRenderer.send("open-project-dialog", options);
          });
      } else {
        ipcRenderer.send("open-project-dialog", options);
      }
    },

    // 创建项目之后初始化项目树
    initTree() {
      if (this.projInfo.type == 1) {
        this.projTree = this.projTreeRawData;

        if (this.$route.name != "RawData")
          this.$router.push({ name: "RawData" });
      } else {
        this.projTree = this.projTreeTxtInOut;
        this.fromModelParams[0].disabled = true;

        if (this.$route.name != "ModelParams")
          this.$router.push({ name: "ModelParams" });
      }
    },

    // 创建新项目后初始化全局参数
    initParams() {
      this.rawData = [
        {
          dataName: "DEM",
          alias: "dem",
          type: "required",
          dataPath: "",
          desc:
            "The DEM data pre-processed by filling and cutting, etc., which will be used in conjunction with outlet data to divide the watershed.",
        },
        {
          dataName: "Outlet",
          alias: "outlet",
          type: "required",
          dataPath: "",
          desc:
            "The total water outlet data of the study area that will be used for watershed division and simulation result extraction.",
        },
        {
          dataName: "Landuse",
          alias: "landuse",
          type: "required",
          dataPath: "",
          desc:
            "The land use data of the study area, and need to ensure that the classification code in the Landusec file is consistent with the Landuse data.",
        },
        {
          dataName: "Landusec",
          alias: "landusec",
          type: "required",
          dataPath: "",
          desc:
            "The classification code file of land use data, and need to ensure that the detailed parameters of the land use type in the Landusec file exist in the SWAT2012.mdb database (urban and crop).",
          refer: "LANDUSE_ID,SWAT_CODE\n1,URMD\n2,CRDY",
        },
        {
          dataName: "Soil",
          alias: "soil",
          type: "required",
          dataPath: "",
          desc:
            "The soil data of the research area, and need to ensure that the classification code in the Soilc file is consistent with the Soil data.",
        },
        {
          dataName: "Soilc",
          alias: "soilc",
          type: "required",
          dataPath: "",
          desc:
            "The soil classification code file, and need to ensure that the detailed parameters of the soil type in the Soilc file exist in the SWAT2012.mdb database (uersoil***).",
          refer: "Value,SNAM\n1,HARTLAND\n2,MONSON",
        },
        {
          dataName: "Weather Generator",
          alias: "generator",
          type: "required",
          table: "WGEN_user",
          desc:
            "Select the weather generator suitable for the research area. If you need to customize WGEN, please fill in the WGEN information of the research area in the SWAT2012.mdb database (WGEN_user) in advance.",
        },
      ];
      this.optionalRawData = [
        {
          dataName: "Weather Stations",
          alias: "stations",
          type: "optional",
          dataPath: "",
          desc:
            "If you need to use the weather station data in the research area, please place the data in the same level directory named after the site code in advance, such as 323103.pcp, 323100.pcp, 323103.tmp, 323100.tmp, etc.",
          refer:
            "Stations file format:\n323103 MINJING +3232 +10312 +2465\n323100 MINJING2 +3233 +10312 +2450\nThe following is the format of five meteorological files (the data starts from the second line, the first line is only for identification and can be filled in Any value):\npcp file format:\n323103\n2013001-99.0\n2013002000.3\n(There is only one blank line at the end)\n- - - - - - - - - -\ntmp file format:\n323103\n2013001-06.7-17.3\n2013002-02.3-15.4\n(There is only one blank line at the end)\n- - - - - - - - - -\nThe first seven digits are the date, followed by the data. Three digits before the decimal point, one digit after the decimal point, the missing value is -99.0\nhmd,slr,wnd file format:\n323103\n20130010004.372\n20130020004.117\n(There is only one blank line at the end)\n- - - - - - - - - -\nThe first seven digits are the date, the following is the data, and the first four digits are the decimal point , Three digits after the decimal point, the missing value is -099.000\n",
        },
      ];

      this.waterParams = [];
      this.hruParams = [];
      this.modelParams = [];
      this.paramsSum = [];

      this.toWaterParams = [];
      this.toHruParams = [];
      this.fromModelParams = [
        {
          id: "1",
          label: "UPREC",
          submodel: "SWAT Execution",
          name: "UPREC",
          desc:
            "Percentage of measurement errors to observed precipitation (%), which varies from ±4.34% to ±15.2% with a mean of ±6.52% in China according to the State Meteorological Administration.",
          type: {
            selected: "v__",
            options: [
              {
                value: "v__",
                label: "Replace",
              },
            ],
            vmin: -15.2,
            vmax: 15.2,
            vminV: -15.2,
            vmaxV: 15.2,
          },
        },
        {
          id: "2",
          label: "Related to Runoff",
          children: [
            {
              id: "2-1",
              pid: "2",
              label: "CN2(.mgt)",
              submodel: "SWAT Execution",
              name: "CN2",
              desc: "Uncertainty of SCS runoff curve number for moisture condition. Min(35), Max(98)",
              type: {
                selected: "a__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 35,
                vmax: 98,
                vminV: 35,
                vmaxV: 98,
                amin: -10,
                amax: 10,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-2",
              pid: "2",
              label: "ESCO(.hru)",
              submodel: "SWAT Execution",
              name: "ESCO",
              desc: "Uncertainty of soil evaporation compensation factor. Min(0), Max(1)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 1,
                vminV: 0,
                vmaxV: 1,
                amin: -1,
                amax: 1,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-3",
              pid: "2",
              label: "EPCO(.hru)",
              submodel: "SWAT Execution",
              name: "EPCO",
              desc: "Uncertainty of plant uptake compensation factor. Min(0), Max(1)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 1,
                vminV: 0,
                vmaxV: 1,
                amin: 0,
                amax: 1,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-4",
              pid: "2",
              label: "SLSUBBSN(.hru)",
              submodel: "SWAT Execution",
              name: "SLSUBBSN",
              desc: "Uncertainty of average slope length. Min(10), Max(150)",
              type: {
                selected: "a__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 10,
                vmax: 150,
                vminV: 10,
                vmaxV: 150,
                amin: -10,
                amax: 10,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-5",
              pid: "2",
              label: "OV_N(.hru)",
              submodel: "SWAT Execution",
              name: "OV_N",
              desc: "Uncertainty of manning's 'n' value for overland flow. Min(0.01), Max(30)",
              type: {
                selected: "a__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0.01,
                vmax: 30,
                vminV: 0.01,
                vmaxV: 30,
                amin: -10,
                amax: 10,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-6",
              pid: "2",
              label: "CANMX(.hru)",
              submodel: "SWAT Execution",
              name: "CANMX",
              desc: "Uncertainty of maximum canopy storage. Min(0), Max(100)",
              type: {
                selected: "a__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 100,
                vminV: 0,
                vmaxV: 100,
                amin: -10,
                amax: 10,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-7",
              pid: "2",
              label: "HRU_SLP(.hru)",
              submodel: "SWAT Execution",
              name: "HRU_SLP",
              desc: "Uncertainty of average slope steepness. Min(0), Max(1)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 1,
                vminV: 0,
                vmaxV: 1,
                amin: -1,
                amax: 1,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-8",
              pid: "2",
              label: "SOL_Z(.sol)",
              submodel: "SWAT Execution",
              name: "SOL_Z",
              desc: "Uncertainty of depth from soil surface to bottom of layer. Min(0), Max(3500)",
              type: {
                selected: "a__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 3500,
                vminV: 0,
                vmaxV: 3500,
                amin: -1000,
                amax: 1000,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-9",
              pid: "2",
              label: "SOL_BD(.sol)",
              submodel: "SWAT Execution",
              name: "SOL_BD",
              desc: "Uncertainty of moist bulk density. Min(0.9), Max(2.5)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0.9,
                vmax: 2.5,
                vminV: 0.9,
                vmaxV: 2.5,
                amin: -1,
                amax: 1,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-10",
              pid: "2",
              label: "SOL_AWC(.sol)",
              submodel: "SWAT Execution",
              name: "SOL_AWC",
              desc: "Uncertainty of available water capacity of the soil layer. Min(0), Max(1)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 1,
                vminV: 0,
                vmaxV: 1,
                amin: -1,
                amax: 1,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-11",
              pid: "2",
              label: "SOL_K(.sol)",
              submodel: "SWAT Execution",
              name: "SOL_K",
              desc: "Uncertainty of saturated hydraulic conductivity. Min(0), Max(2000)",
              type: {
                selected: "a__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 2000,
                vminV: 0,
                vmaxV: 2000,
                amin: -100,
                amax: 100,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-12",
              pid: "2",
              label: "SOL_ALB(.sol)",
              submodel: "SWAT Execution",
              name: "SOL_ALB",
              desc: "Uncertainty of moist soil albedo. Min(0), Max(0.25)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 0.25,
                vminV: 0,
                vmaxV: 0.25,
                amin: -0.25,
                amax: 0.25,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-13",
              pid: "2",
              label: "GW_REVAP(.gw)",
              submodel: "SWAT Execution",
              name: "GW_REVAP",
              desc: "Uncertainty of groundwater 'revap' coefficient. Min(0.02), Max(0.2)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0.02,
                vmax: 0.2,
                vminV: 0.02,
                vmaxV: 0.2,
                amin: -0.18,
                amax: 0.18,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-14",
              pid: "2",
              label: "GW_DELAY(.gw)",
              submodel: "SWAT Execution",
              name: "GW_DELAY",
              desc: "Uncertainty of groundwater delay (days). Min(0), Max(500)",
              type: {
                selected: "a__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 500,
                vminV: 0,
                vmaxV: 500,
                amin: -100,
                amax: 100,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-15",
              pid: "2",
              label: "REVAPMN(.gw)",
              submodel: "SWAT Execution",
              name: "REVAPMN",
              desc: "Uncertainty of threshold depth of water in the shallow aquifer for 'revap' to occur [mm]. Min(0), Max(500)",
              type: {
                selected: "a__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 500,
                vminV: 0,
                vmaxV: 500,
                amin: -100,
                amax: 100,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-16",
              pid: "2",
              label: "GWQMN(.gw)",
              submodel: "SWAT Execution",
              name: "GWQMN",
              desc: "Uncertainty of threshold depth of water in the shallow aquifer required for return flow to occur [mm]. Min(0), Max(5000)",
              type: {
                selected: "a__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 5000,
                vminV: 0,
                vmaxV: 5000,
                amin: -1000,
                amax: 1000,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-17",
              pid: "2",
              label: "ALPHA_BF(.gw)",
              submodel: "SWAT Execution",
              name: "ALPHA_BF",
              desc: "Uncertainty of baseflow alpha factor [days]. Min(0), Max(1)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 1,
                vminV: 0,
                vmaxV: 1,
                amin: -1,
                amax: 1,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-18",
              pid: "2",
              label: "RCHRG_DP(.gw)",
              submodel: "SWAT Execution",
              name: "RCHRG_DP",
              desc: "Uncertainty of deep aquifer percolation fraction. Min(0), Max(1)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 1,
                vminV: 0,
                vmaxV: 1,
                amin: -1,
                amax: 1,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-19",
              pid: "2",
              label: "CH_K2(.rte)",
              submodel: "SWAT Execution",
              name: "CH_K2",
              desc: "Uncertainty of effective hydraulic conductivity [mm/hr]. Min(-0.01), Max(500)",
              type: {
                selected: "a__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: -0.01,
                vmax: 500,
                vminV: -0.01,
                vmaxV: 500,
                amin: -100,
                amax: 100,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-20",
              pid: "2",
              label: "CH_N2(.rte)",
              submodel: "SWAT Execution",
              name: "CH_N2",
              desc: "Uncertainty of manning's 'n' value for the main channel. Min(-0.01), Max(0.3)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: -0.01,
                vmax: 0.3,
                vminV: -0.01,
                vmaxV: 0.3,
                amin: -0.3,
                amax: 0.3,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-21",
              pid: "2",
              label: "ALPHA_BNK(.rte)",
              submodel: "SWAT Execution",
              name: "ALPHA_BNK",
              desc: "Uncertainty of baseflow alpha factor for bank storage. Min(0), Max(1)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 1,
                vminV: 0,
                vmaxV: 1,
                amin: -1,
                amax: 1,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-22",
              pid: "2",
              label: "SMFMX(.bsn)",
              submodel: "SWAT Execution",
              name: "SMFMX",
              desc: "Uncertainty of maximum melt rate for snow during year (occurs on summer solstice)[mm H2O/degC-day]. Min(0), Max(20)",
              type: {
                selected: "a__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 20,
                vminV: 0,
                vmaxV: 20,
                amin: -10,
                amax: 10,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-23",
              pid: "2",
              label: "SMFMN(.bsn)",
              submodel: "SWAT Execution",
              name: "SMFMN",
              desc: "Uncertainty of minimum melt rate for snow during the year (occurs on winter solstice)[mm H2O/degC-day]. Min(0), Max(20)",
              type: {
                selected: "a__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 20,
                vminV: 0,
                vmaxV: 20,
                amin: -10,
                amax: 10,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-24",
              pid: "2",
              label: "SFTMP(.bsn)",
              submodel: "SWAT Execution",
              name: "SFTMP",
              desc: "Uncertainty of snowfall temperature [OPTINAL]. Min(-20), Max(20)",
              type: {
                selected: "a__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: -20,
                vmax: 20,
                vminV: -20,
                vmaxV: 20,
                amin: -10,
                amax: 10,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-25",
              pid: "2",
              label: "SMTMP(.bsn)",
              submodel: "SWAT Execution",
              name: "SMTMP",
              desc: "Uncertainty of snow melt base temperature. Min(-20), Max(20)",
              type: {
                selected: "a__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: -20,
                vmax: 20,
                vminV: -20,
                vmaxV: 20,
                amin: -10,
                amax: 10,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-26",
              pid: "2",
              label: "TIMP(.bsn)",
              submodel: "SWAT Execution",
              name: "TIMP",
              desc: "Uncertainty of snow pack temperature lag factor. Min(0), Max(1)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 1,
                vminV: 0,
                vmaxV: 1,
                amin: -1,
                amax: 1,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-27",
              pid: "2",
              label: "SURLAG(.bsn)",
              submodel: "SWAT Execution",
              name: "SURLAG",
              desc: "Uncertainty of surface runoff lag time. Min(0.05), Max(24)",
              type: {
                selected: "a__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0.05,
                vmax: 24,
                vminV: 0.05,
                vmaxV: 24,
                amin: -10,
                amax: 10,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-28",
              pid: "2",
              label: "TLAPS(.sub)",
              submodel: "SWAT Execution",
              name: "TLAPS",
              desc: "Uncertainty of temperature lapse rate [degC/km]. Min(-10), Max(10)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: -10,
                vmax: 10,
                vminV: -10,
                vmaxV: 10,
                amin: -10,
                amax: 10,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-29",
              pid: "2",
              label: "CH_K1(.sub)",
              submodel: "SWAT Execution",
              name: "CH_K1",
              desc: "Uncertainty of effective hydraulic conductivity in tributary channel alluvium. Min(0), Max(300)",
              type: {
                selected: "a__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 300,
                vminV: 0,
                vmaxV: 300,
                amin: -100,
                amax: 100,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-30",
              pid: "2",
              label: "CH_N1(.sub)",
              submodel: "SWAT Execution",
              name: "CH_N1",
              desc: "Uncertainty of Manning's 'n' value for the tributary channels. Min(0.01), Max(30)",
              type: {
                selected: "a__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0.01,
                vmax: 30,
                vminV: 0.01,
                vmaxV: 30,
                amin: -10,
                amax: 10,
                rmin: 1,
                rmax: 2,
              },
            },
          ],
        },
        {
          id: "3",
          label: "Related to Sediment",
          children: [
            {
              id: "3-1",
              pid: "3",
              label: "USLE_P(.mgt)",
              submodel: "SWAT Execution",
              name: "USLE_P",
              desc:
                "Uncertainty of USLE support practice factor. Min(0), Max(1)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 1,
                vminV: 0,
                vmaxV: 1,
                amin: -1,
                amax: 1,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "3-2",
              pid: "3",
              label: "SPCON(.bsn)",
              submodel: "SWAT Execution",
              name: "SPCON",
              desc:
                "Uncertainty of linear parameter for calculating the maximum amount of sediment that can be reentrained during channel sediment routing. Min(0.001), Max(0.01)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0.001,
                vmax: 0.01,
                vminV: 0.001,
                vmaxV: 0.01,
                amin: -0.01,
                amax: 0.01,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "3-3",
              pid: "3",
              label: "SPEXP(.bsn)",
              submodel: "SWAT Execution",
              name: "SPEXP",
              desc:
                "Uncertainty of exponent parameter for calculating sediment reentrained in channel sediment routing. Min(1), Max(1.5)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 1,
                vmax: 1.5,
                vminV: 1,
                vmaxV: 1.5,
                amin: -0.5,
                amax: 0.5,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "3-4",
              pid: "3",
              label: "CH_COV1(.rte)",
              submodel: "SWAT Execution",
              name: "CH_COV1",
              desc:
                "Uncertainty of channel erodibility factor. Min(-0.05), Max(0.6)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: -0.05,
                vmax: 0.6,
                vminV: -0.05,
                vmaxV: 0.6,
                amin: -0.65,
                amax: 0.65,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "3-5",
              pid: "3",
              label: "CH_COV2(.rte)",
              submodel: "SWAT Execution",
              name: "CH_COV2",
              desc: "Uncertainty of channel cover factor. Min(-0.001), Max(1)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: -0.001,
                vmax: 1,
                vminV: -0.001,
                vmaxV: 1,
                amin: -1,
                amax: 1,
                rmin: 1,
                rmax: 2,
              },
            },
          ],
        },
        {
          id: "4",
          label: "Related to Nutrients",
          children: [
            {
              id: "4-1",
              pid: "4",
              label: "RCN(.bsn)",
              submodel: "SWAT Execution",
              name: "RCN",
              desc: "Uncertainty of concentration of nitrogen in rainfall. Min(0), Max(15)",
              type: {
                selected: "a__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 15,
                vminV: 0,
                vmaxV: 15,
                amin: -5,
                amax: 5,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "4-2",
              pid: "4",
              label: "BIOMIX(.mgt)",
              submodel: "SWAT Execution",
              name: "BIOMIX",
              desc:
                "Uncertainty of biological mixing efficiency. Min(0), Max(1)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 1,
                vminV: 0,
                vmaxV: 1,
                amin: -1,
                amax: 1,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "4-3",
              pid: "4",
              label: "NPERCO(.bsn)",
              submodel: "SWAT Execution",
              name: "NPERCO",
              desc:
                "Uncertainty of nitrogen percolation coefficient. Min(0.01), Max(1)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0.01,
                vmax: 1,
                vminV: 0.01,
                vmaxV: 1,
                amin: -1,
                amax: 1,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "4-4",
              pid: "4",
              label: "PPERCO(.bsn)",
              submodel: "SWAT Execution",
              name: "PPERCO",
              desc: "Uncertainty of phosphorus percolation coefficient. Min(10), Max(17.5)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 10,
                vmax: 17.5,
                vminV: 10,
                vmaxV: 17.5,
                amin: -7.5,
                amax: 7.5,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "4-5",
              pid: "4",
              label: "PHOSKD(.bsn)",
              submodel: "SWAT Execution",
              name: "PHOSKD",
              desc: "Uncertainty of phosphorus percolation coefficient. Min(100), Max(200)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 100,
                vmax: 200,
                vminV: 100,
                vmaxV: 200,
                amin: -100,
                amax: 100,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "4-6",
              pid: "4",
              label: "ERORGN(.hru)",
              submodel: "SWAT Execution",
              name: "ERORGN",
              desc: "Uncertainty of organic N enrichment ratio. Min(0), Max(5)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 5,
                vminV: 0,
                vmaxV: 5,
                amin: -5,
                amax: 5,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "4-7",
              pid: "4",
              label: "ERORGP(.hru)",
              submodel: "SWAT Execution",
              name: "ERORGP",
              desc: "Uncertainty of organic P enrichment ratio. Min(0), Max(5)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 5,
                vminV: 0,
                vmaxV: 5,
                amin: -5,
                amax: 5,
                rmin: 1,
                rmax: 2,
              },
            },
          ],
        },
      ],
      
      this.toModelParams = []

      this.simSetting = {
        saMethod: 0,
        simRange: ["1977-01-01", "1978-12-31"],
        simTimes: 66,
        simTargets: ["Flow"],
        timeStep: 0,
        observed: false,
        objective: ["NSE"],
        waterStationShp: "",
        basinTxt: "",
      };
      this.observedInfo = [
        {
          name: "Flow",
          path: "",
          data: [],
          obj: {},
        },
      ];

      this.activeStep = 1;
      this.runningTip = {
        runningNum: 0,
        total: 0,
        percentage: 0,
        remainingTime: {
          hour: 0,
          minute: 0,
          second: 0,
          totalSeconds: 0,
        },
        stop: false,
      };

      this.paramsSample = [];

      this.calibrationResult = [];

      this.scoreSA = {};
      this.simResult = {};
    },

    // 创建新项目
    createNewProj() {
      // 初始化全局参数
      this.initParams();
      // 初始化左侧树
      this.initTree();
    },

    // 根据watershed子页面的选择，更新主页面变量
    updateWaterParams(selectedParams) {
      this.waterParams = selectedParams;
      var i = 0,
        j = 0,
        n = 0,
        flag = false;
      // 寻找water参数在paramSum中的开始位置和总数
      for (; i < this.paramsSum.length; i++) {
        if (this.paramsSum[i].submodel == "Watershed Delineation") {
          n++;
          flag = true;
        } else if (flag) {
          break;
        }
      }
      j = i - n;
      // 删除paramSum中的water参数，重新添加所有的water参数
      this.paramsSum.splice(j, n);
      for (i = this.waterParams.length - 1; i >= 0; i--) {
        var param = this.waterParams[i];
        this.paramsSum.unshift(param);
      }
    },
    // 根据hru子页面的选择，更新主页面变量
    updateHruParams(selectedParams) {
      this.hruParams = selectedParams;
      // 删除已有的
      var i = 0,
        j = 0,
        n = 0,
        flag = false;
      for (; i < this.paramsSum.length; i++) {
        if (this.paramsSum[i].submodel == "HRU Creation") {
          n++;
          flag = true;
        } else if (flag) {
          break;
        }
      }
      j = i - n;
      this.paramsSum.splice(j, n);
      // 若原来就没有，要找到Watershed Delineation的最后一个
      if (!flag) {
        for (j = 0; j < this.paramsSum.length; j++) {
          if (this.paramsSum[j].submodel == "Watershed Delineation") {
            flag = true;
          } else {
            break;
          }
        }
      }
      if (!flag) j = 0;
      for (i = this.hruParams.length - 1; i >= 0; i--) {
        var param = this.hruParams[i];
        this.paramsSum.splice(j, 0, param);
      }
    },
    // 根据model子页面的选择，更新主页面变量
    updateModelParams(selectedParams) {
      this.modelParams = selectedParams;
      var i = 0,
        j = 0,
        n = 0,
        flag = false;
      // 寻找model参数在paramSum中的开始位置和总数
      for (; i < this.paramsSum.length; i++) {
        if (this.paramsSum[i].submodel === "SWAT Execution") {
          n++;
          flag = true;
        } else if (flag) {
          break;
        }
      }
      j = i - n;
      // 删除paramSum中的model参数，重新添加所有的model参数
      this.paramsSum.splice(j, n);
      for (i = 0; i < this.modelParams.length; i++) {
        var param = this.modelParams[i];
        this.paramsSum.push(param);
      }
    },

    // 更新三个子页面的 From 和 To
    updateToWaterParams(to) {
      this.toWaterParams = to;
    },
    updateToHruParams(to) {
      this.toHruParams = to;
    },
    updateFromToModelParams(from, to) {
      this.fromModelParams = from;
      this.toModelParams = to;
    },

    // 保存修改或保存项目
    saveSettingOrProj() {
      this.saveDialogVisible = false;

      // 0 保存修改；1 保存项目
      if (this.saveType == 0) {
        // 判断填写是否齐全 其余判断可以在用户填写时判断
        var flag = true;
        // Raw Data
        if (this.projInfo.type == 1) {
          for (var i = 0; i < this.rawData.length; i++) {
            var data = this.rawData[i];
            if (data.type == "required" && data.dataPath == "") {
              this.$message({
                showClose: true,
                message: "Please confirm that the required data is complete!",
                type: "error",
              });
              flag = false;
              if (this.$route.name != "RawData")
                this.$router.push({ name: "RawData" });
              return;
            }
          }
        }
        // Parameter Sum
        if (this.projInfo.type == 1) {
          if (this.paramsSum.length == 0) {
            this.$message({
              showClose: true,
              message: "Please select parameters to be evaluated!",
              type: "error",
            });
            flag = false;
            if (this.$route.name != "ParamsSummary")
              this.$router.push({ name: "ParamsSummary" });
            return;
          }
        } else {
          if (this.paramsSum.length == 0) {
            this.$message({
              showClose: true,
              message: "Please select parameters to be evaluated!",
              type: "error",
            });
            flag = false;
            if (this.$route.name != "ModelParams")
              this.$router.push({ name: "ModelParams" });
            return;
          }
        }
        // Simulate Setting
        if (this.simSetting.simTimes == null) {
          this.$message({
            showClose: true,
            message: "Please enter the times of simulation!",
            type: "error",
          });
          flag = false;
          if (this.$route.name != "SimSetting")
            this.$router.push({ name: "SimSetting" });
          return;
        }
        if (this.simSetting.simRange == null) {
          this.$message({
            showClose: true,
            message: "Please select the period of simulation!",
            type: "error",
          });
          flag = false;
          if (this.$route.name != "SimSetting")
            this.$router.push({ name: "SimSetting" });
          return;
        }
        if (this.simSetting.simTargets.length == 0) {
          this.$message({
            showClose: true,
            message: "Please select the target of simulation!",
            type: "error",
          });
          flag = false;
          if (this.$route.name != "SimSetting")
            this.$router.push({ name: "SimSetting" });
          return;
        }
        // if (this.simSetting.observed) {
          // 1 raw data; 0 TxtInOut
          if ( this.projInfo.type == 1 && this.simSetting.waterStationShp == "" ) {
            this.$message({
              showClose: true,
              message: "Please select the hydrological station data!",
              type: "error",
            });
            flag = false;
            if (this.$route.name != "SimSetting")
              this.$router.push({ name: "SimSetting" });
            return;
          } else if ( this.projInfo.type == 0 && this.simSetting.basinTxt == "" ) {
            this.$message({
              showClose: true,
              message:
                "Please select the watershed ID file where the hydrological station is located!",
              type: "error",
            });
            flag = false;
            if (this.$route.name != "SimSetting")
              this.$router.push({ name: "SimSetting" });
            return;
          }
        // }
        // Observed data
        if (this.observedInfo[0].path != "") {
          if (this.simSetting.objective.length == 0) {
            this.$message({
              showClose: true,
              message: "Please select the objective function of simulation!",
              type: "error",
            });
            flag = false;
            return;
          }
        }

        if (flag) {
          // 整合数据、参数、设置
          this.totalModify = {
            projInfo: this.projInfo,
            rawData: this.rawData,
            optionalRawData: this.optionalRawData,
            paramsSum: this.paramsSum,
            simSetting: this.simSetting,
            observedInfo: this.observedInfo,
          };
          ipcRenderer.send("save-setting", this.totalModify);

          saveLoading = this.$loading({
            lock: true,
            text: "Saving, please wait",
            spinner: "el-icon-loading",
            background: "rgba(0, 0, 0, 0.7)",
          });

        }
      } else {
        // 整合数据、参数、设置
        this.totalModify = {
          projInfo: this.projInfo,
          rawData: this.rawData,
          optionalRawData: this.optionalRawData,
          paramsSum: this.paramsSum,
          simSetting: this.simSetting,
          observedInfo: this.observedInfo,

          // 保存项目参数
          waterParams: this.waterParams,
          hruParams: this.hruParams,
          modelParams: this.modelParams,

          toWaterParams: this.toWaterParams,
          toHruParams: this.toHruParams,
          toModelParams: this.toModelParams,
          fromModelParams: this.fromModelParams,

          activeStep: this.activeStep,
          runningTip: this.runningTip,
          paramsSample: this.paramsSample,

          calibrationResult: this.calibrationResult,

          scoreSA: this.scoreSA,
          simResult: this.simResult,
        };
        ipcRenderer.send("save-project", this.totalModify);
      }
    },

    // 单纯保存项目
    saveProject() {
      // 整合数据、参数、设置
      this.totalModify = {
        projInfo: this.projInfo,
        rawData: this.rawData,
        optionalRawData: this.optionalRawData,
        paramsSum: this.paramsSum,
        simSetting: this.simSetting,
        observedInfo: this.observedInfo,

        // 保存项目参数
        waterParams: this.waterParams,
        hruParams: this.hruParams,
        modelParams: this.modelParams,

        toWaterParams: this.toWaterParams,
        toHruParams: this.toHruParams,
        toModelParams: this.toModelParams,
        fromModelParams: this.fromModelParams,

        activeStep: this.activeStep,
        runningTip: this.runningTip,
        paramsSample: this.paramsSample,

        calibrationResult: this.calibrationResult,

        scoreSA: this.scoreSA,
        simResult: this.simResult,
      };
      ipcRenderer.send("save-project-exit", this.totalModify);
    },

    // 获取子组件传来的敏感性得分
    getScoreSA(score) {
      this.scoreSA = score;
      console.log(this.scoreSA);
    },

    // 获取子组件传来的模拟结果
    getSimResult(result) {
      this.simResult = result;
      console.log(this.simResult);
    },

    // 获取目标函数得分
    getObjScore(observedInfo) {
      this.observedInfo = observedInfo;

      // 计算每个Target的每个目标函数的最佳参数组
      this.calibrationResult = [];
      this.observedInfo.forEach((obs) => {
        if (obs.path != "") {
          // 遍历每一个目标函数，获得最有得分及其对应的参数组
          var result = {
            name: obs.name,
          };
          for (const obj in obs.obj) {
            if (obs.obj.hasOwnProperty(obj)) {
              const score = obs.obj[obj];

              var niceScore = parseFloat(score[0]);
              var niceIndex = 0;
              score.forEach((n, index) => {
                if (obj == "NSE" || obj == "RSquared") {
                  if (n != "" && parseFloat(n) > niceScore) {
                    niceScore = parseFloat(n);
                    niceIndex = index;
                  }
                } else if (obj == "PBIAS") {
                  niceScore = Math.abs(niceScore)
                  if (n != "" && Math.abs(parseFloat(n)) < niceScore) {
                    niceScore = parseFloat(n);
                    niceIndex = index;
                  }
                }
              });

              var niceStr = "optimal" + obj;
              result[niceStr] = niceScore;
              var niceParas = "paras" + obj;
              result[niceParas] = [];
              result[niceParas].push(this.paramsSample[niceIndex]);
            }
          }
          this.calibrationResult.push(result);
        }
      });
      console.log(this.calibrationResult);
    },

    // 对象 装进 数组
    objInArr(obj) {
      var arr = [];
      if (obj == undefined) {
        return arr;
      } else if (obj.length == undefined || typeof obj == "string") {
        arr.push(obj);
        return arr;
      } else {
        return obj;
      }
    },
  },

  mounted() {
    var that = this;
    // 成功保存修改
    ipcRenderer.on("setting-saved", (event, observedInfo) => {
      // 将观测数据保存到变量中
      that.observedInfo = observedInfo;
      saveLoading.close()
      that.$message({
        showClose: true,
        message: "Settings saved successfully",
        type: "success",
      });
    });

    //成功保存项目
    ipcRenderer.on("project-saved", (event) => {
      that.$message({
        showClose: true,
        message: "Project saved successfully",
        type: "success",
      });
    });

    // 成功打开项目
    ipcRenderer.on("read-swatsa-file", (event, totalParams) => {

      // 数组如果只有一个元素，会被解析成对象
      that.projInfo = totalParams.projInfo;
      that.rawData = that.objInArr(totalParams.rawData);
      that.optionalRawData = that.objInArr(totalParams.optionalRawData);
      that.paramsSum = that.objInArr(totalParams.paramsSum);
      for (var i = 0; i < that.paramsSum.length; i++) {
        var p = that.paramsSum[i];
        p.type.options = that.objInArr(p.type.options);
      }

      // simSetting 的属性还有数组
      var setting = totalParams.simSetting;
      setting.simRange = that.objInArr(setting.simRange);
      setting.simTargets = that.objInArr(setting.simTargets);
      setting.objective = that.objInArr(setting.objective);
      that.simSetting = setting;

      that.observedInfo = that.objInArr(totalParams.observedInfo);
      for (var i = 0; i < that.observedInfo.length; i++) {
        var obs = that.observedInfo[i];
        obs.data = that.objInArr(obs.data);
        if(obs.obj == '')
          obs.obj = {}
      }

      // 选择参数的type也是数组
      that.waterParams = that.objInArr(totalParams.waterParams);
      for (var i = 0; i < that.waterParams.length; i++) {
        var p = that.waterParams[i];
        p.type.options = that.objInArr(p.type.options);
      }
      that.hruParams = that.objInArr(totalParams.hruParams);
      for (var i = 0; i < that.hruParams.length; i++) {
        var p = that.hruParams[i];
        p.type.options = that.objInArr(p.type.options);
      }
      that.modelParams = that.objInArr(totalParams.modelParams);
      for (var i = 0; i < that.modelParams.length; i++) {
        var p = that.modelParams[i];
        p.type.options = that.objInArr(p.type.options);
      }

      that.toWaterParams = that.objInArr(totalParams.toWaterParams);
      that.toHruParams = that.objInArr(totalParams.toHruParams);
      that.toModelParams = that.objInArr(totalParams.toModelParams);
      for (var i = 0; i < that.toModelParams.length; i++) {
        var data = that.toModelParams[i];       
        if (data.children != undefined) {
          data.children = that.objInArr(data.children);
        }else{
          data.type.options = that.objInArr(data.type.options);
        }
      }
      that.fromModelParams = that.objInArr(totalParams.fromModelParams);
      for (var i = 0; i < that.fromModelParams.length; i++) {
        var data = that.fromModelParams[i];
        if (data.children != undefined) {
          data.children = that.objInArr(data.children);
        }else{
          data.type.options = that.objInArr(data.type.options);
        }
      }

      that.activeStep = totalParams.activeStep;
      that.runningTip = totalParams.runningTip;
      that.paramsSample = that.objInArr(totalParams.paramsSample);

      that.calibrationResult = that.objInArr(totalParams.calibrationResult);
      for (var i = 0; i < that.calibrationResult.length; i++) {
        var ca = that.calibrationResult[i];
        for (var j = 0; j < that.simSetting.objective.length; j++) {
          var str = "paras" + that.simSetting.objective[j];
          ca[str] = that.objInArr(ca[str]);
        }
      }

      that.scoreSA = totalParams.scoreSA;
      if(that.scoreSA != ""){
        for (let k = 0; k < that.simSetting.simTargets.length; k++) {
          var target = that.simSetting.simTargets[k];
          
          if(that.scoreSA[target].SI != null){
            that.scoreSA[target].SI = that.objInArr(that.scoreSA[target].SI)
          }
          if(that.scoreSA[target].S2 != null){
            var fs2 = that.scoreSA[target].S2
            var s2 = []
            for (let i = 0; i < fs2.length; i++) {
              var s = []
              for (let j = 0; j < fs2.length; j++) 
                s.push(fs2[i][j])
              s2.push(s)
            }
            that.scoreSA[target].S2 = s2
          }
        }
      }else{
        that.scoreSA = {}
      }
      that.simResult = totalParams.simResult;

      that.initTree();
    });

    // 没有成功打开项目
    ipcRenderer.on("read-swatsa-failed", (event) => {
      that.$message({
        showClose: true,
        message:
          "The project was not previously saved and could not be opened.",
        type: "warning",
      });
    });

    //
    ipcRenderer.on("save-project-before-close", (event) => {
      that.saveType = 1;
      that.saveProject();
    });
  },

  data() {
    return {
      // ogmsUrl: __static+'\\OpenGMS.png',
      ogmsUrl: "./static/images/OpenGMS.png",
      lang: "en",
      langOptions: [
        {
          value: "en",
          label: "English",
        },
        {
          value: "cn",
          label: "简体中文",
        },
      ],

      saveType: 0,
      saveDialogVisible: false,

      projInfo: {
        name: "",
        path: "",
        desc: "",
        type: 0,
        tioPath: "",
      },

      projTree: [
        {
          id: "projectTree",
          label: "Project Tree",
          icon: "el-icon-s-home",
        },
      ],
      projTreeRawData: [
        // {
        //   id: 'currentProj',
        //   label: 'Current Project',
        //   icon: 'el-icon-s-home',
        //   children: [
        {
          id: "configData",
          label: "Data config",
          icon: "el-icon-s-tools",
        },
        {
          id: "configParams",
          label: "Params config",
          icon: "el-icon-s-tools",
          children: [
            {
              id: "watershedParams",
              label: "Watershed delineation",
            },
            {
              id: "hruParams",
              label: "HRU creation",
            },
            {
              id: "modelParams",
              label: "SWAT execution",
            },
            {
              id: "summary",
              label: "Summary",
            },
          ],
        },
        {
          id: "simulation",
          label: "Simulation",
          icon: "el-icon-menu",
          children: [
            {
              id: "setting",
              label: "Setting & Observations",
            },
            {
              id: "execution",
              label: "Sampling & Execution",
            },
            {
              id: "singleRun",
              label: "Single run (optional)",
            },
          ],
        },
        {
          id: "resultDisp",
          label: "Result display",
          icon: "el-icon-s-data",
          children: [
            {
              id: "simResult",
              label: "Simulation result",
            },
            {
              id: "saScore",
              label: "Sensitivity index",
            },
          ],
        },
        //   ]
        // }
      ],
      projTreeTxtInOut: [
        // {
        //   id: 'currentProj',
        //   label: 'Current Project',
        //   icon: 'el-icon-s-home',
        //   children: [
        {
          id: "configParams",
          label: "Params config",
          icon: "el-icon-s-tools",
          children: [
            {
              id: "modelParams",
              label: "SWAT execution",
            },
          ],
        },
        {
          id: "simulation",
          label: "Simulation",
          icon: "el-icon-menu",
          children: [
            {
              id: "setting",
              label: "Setting & Observations",
            },
            {
              id: "execution",
              label: "Sampling & Execution",
            },
            {
              id: "singleRun",
              label: "Single run (optional)",
            },
          ],
        },
        {
          id: "resultDisp",
          label: "Result display",
          icon: "el-icon-s-data",
          children: [
            {
              id: "simResult",
              label: "Simulation result",
            },
            {
              id: "saScore",
              label: "Sensitivity index",
            },
          ],
        },
        //   ]
        // }
      ],

      rawData: [
        {
          dataName: "DEM",
          alias: "dem",
          type: "required",
          dataPath: "G:\\SWAT\\DATA\\dem.tif",
          desc:
            "The DEM data pre-processed by filling and cutting, etc., which will be used in conjunction with outlet data to divide the watershed.",
        },
        {
          dataName: "Outlet",
          alias: "outlet",
          type: "required",
          dataPath: "G:\\SWAT\\DATA\\outlet.shp",
          desc:
            "The total water outlet data of the study area that will be used for watershed division and simulation result extraction.",
        },
        {
          dataName: "Landuse",
          alias: "landuse",
          type: "required",
          dataPath: "G:\\SWAT\\DATA\\landuse.tif",
          desc:
            "The land use data of the study area, and need to ensure that the classification code in the Landusec file is consistent with the Landuse data.",
        },
        {
          dataName: "Landusec",
          alias: "landusec",
          type: "required",
          dataPath: "G:\\SWAT\\DATA\\landusec.txt",
          desc:
            "The classification code file of land use data, and need to ensure that the detailed parameters of the land use type in the Landusec file exist in the SWAT2012.mdb database (urban and crop).",
          refer: "LANDUSE_ID,SWAT_CODE\n1,URMD\n2,CRDY",
        },
        {
          dataName: "Soil",
          alias: "soil",
          type: "required",
          dataPath: "G:\\SWAT\\DATA\\soil.tif",
          desc:
            "The soil data of the research area, and need to ensure that the classification code in the Soilc file is consistent with the Soil data.",
        },
        {
          dataName: "Soilc",
          alias: "soilc",
          type: "required",
          dataPath: "G:\\SWAT\\DATA\\soilc.txt",
          desc:
            "The soil classification code file, and need to ensure that the detailed parameters of the soil type in the Soilc file exist in the SWAT2012.mdb database (uersoil***).",
          refer: "Value,SNAM\n1,HARTLAND\n2,MONSON",
        },
        {
          dataName: "Weather Generator",
          alias: "generator",
          type: "required",
          table: "WGEN_user",
          desc:
            "Select the weather generator suitable for the research area. If you need to customize WGEN, please fill in the WGEN information of the research area in the SWAT2012.mdb database (WGEN_user) in advance.",
        },
      ],
      optionalRawData: [
        {
          dataName: "Weather Stations",
          alias: "stations",
          type: "optional",
          dataPath: "",
          desc:
            "If you need to use the weather station data in the research area, please place the data in the same level directory named after the site code in advance, such as 323103.pcp, 323100.pcp, 323103.tmp, 323100.tmp, etc.",
          refer:
            "Stations file format:\n323103 MINJING +3232 +10312 +2465\n323100 MINJING2 +3233 +10312 +2450\nThe following is the format of five meteorological files (the data starts from the second line, the first line is only for identification and can be filled in Any value):\npcp file format:\n323103\n2013001-99.0\n2013002000.3\n(There is only one blank line at the end)\n- - - - - - - - - -\ntmp file format:\n323103\n2013001-06.7-17.3\n2013002-02.3-15.4\n(There is only one blank line at the end)\n- - - - - - - - - -\nThe first seven digits are the date, followed by the data. Three digits before the decimal point, one digit after the decimal point, the missing value is -99.0\nhmd,slr,wnd file format:\n323103\n20130010004.372\n20130020004.117\n(There is only one blank line at the end)\n- - - - - - - - - -\nThe first seven digits are the date, the following is the data, and the first four digits are the decimal point , Three digits after the decimal point, the missing value is -099.000\n",
        },
      ],

      waterParams: [],
      hruParams: [],
      modelParams: [],
      paramsSum: [],

      toWaterParams: [],
      toHruParams: [],
      fromModelParams: [
        {
          id: "1",
          label: "UPREC",
          submodel: "SWAT Execution",
          name: "UPREC",
          desc:
            "Percentage of measurement errors to observed precipitation (%), which varies from ±4.34% to ±15.2% with a mean of ±6.52% in China according to the State Meteorological Administration.",
          type: {
            selected: "v__",
            options: [
              {
                value: "v__",
                label: "Replace",
              },
            ],
            vmin: -15.2,
            vmax: 15.2,
            vminV: -15.2,
            vmaxV: 15.2,
          },
        },
        {
          id: "2",
          label: "Related to Runoff",
          children: [
            {
              id: "2-1",
              pid: "2",
              label: "CN2(.mgt)",
              submodel: "SWAT Execution",
              name: "CN2",
              desc: "Uncertainty of SCS runoff curve number for moisture condition. Min(35), Max(98)",
              type: {
                selected: "a__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 35,
                vmax: 98,
                vminV: 35,
                vmaxV: 98,
                amin: -10,
                amax: 10,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-2",
              pid: "2",
              label: "ESCO(.hru)",
              submodel: "SWAT Execution",
              name: "ESCO",
              desc: "Uncertainty of soil evaporation compensation factor. Min(0), Max(1)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 1,
                vminV: 0,
                vmaxV: 1,
                amin: -1,
                amax: 1,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-3",
              pid: "2",
              label: "EPCO(.hru)",
              submodel: "SWAT Execution",
              name: "EPCO",
              desc: "Uncertainty of plant uptake compensation factor. Min(0), Max(1)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 1,
                vminV: 0,
                vmaxV: 1,
                amin: 0,
                amax: 1,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-4",
              pid: "2",
              label: "SLSUBBSN(.hru)",
              submodel: "SWAT Execution",
              name: "SLSUBBSN",
              desc: "Uncertainty of average slope length. Min(10), Max(150)",
              type: {
                selected: "a__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 10,
                vmax: 150,
                vminV: 10,
                vmaxV: 150,
                amin: -10,
                amax: 10,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-5",
              pid: "2",
              label: "OV_N(.hru)",
              submodel: "SWAT Execution",
              name: "OV_N",
              desc: "Uncertainty of manning's 'n' value for overland flow. Min(0.01), Max(30)",
              type: {
                selected: "a__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0.01,
                vmax: 30,
                vminV: 0.01,
                vmaxV: 30,
                amin: -10,
                amax: 10,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-6",
              pid: "2",
              label: "CANMX(.hru)",
              submodel: "SWAT Execution",
              name: "CANMX",
              desc: "Uncertainty of maximum canopy storage. Min(0), Max(100)",
              type: {
                selected: "a__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 100,
                vminV: 0,
                vmaxV: 100,
                amin: -10,
                amax: 10,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-7",
              pid: "2",
              label: "HRU_SLP(.hru)",
              submodel: "SWAT Execution",
              name: "HRU_SLP",
              desc: "Uncertainty of average slope steepness. Min(0), Max(1)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 1,
                vminV: 0,
                vmaxV: 1,
                amin: -1,
                amax: 1,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-8",
              pid: "2",
              label: "SOL_Z(.sol)",
              submodel: "SWAT Execution",
              name: "SOL_Z",
              desc: "Uncertainty of depth from soil surface to bottom of layer. Min(0), Max(3500)",
              type: {
                selected: "a__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 3500,
                vminV: 0,
                vmaxV: 3500,
                amin: -1000,
                amax: 1000,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-9",
              pid: "2",
              label: "SOL_BD(.sol)",
              submodel: "SWAT Execution",
              name: "SOL_BD",
              desc: "Uncertainty of moist bulk density. Min(0.9), Max(2.5)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0.9,
                vmax: 2.5,
                vminV: 0.9,
                vmaxV: 2.5,
                amin: -1,
                amax: 1,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-10",
              pid: "2",
              label: "SOL_AWC(.sol)",
              submodel: "SWAT Execution",
              name: "SOL_AWC",
              desc: "Uncertainty of available water capacity of the soil layer. Min(0), Max(1)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 1,
                vminV: 0,
                vmaxV: 1,
                amin: -1,
                amax: 1,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-11",
              pid: "2",
              label: "SOL_K(.sol)",
              submodel: "SWAT Execution",
              name: "SOL_K",
              desc: "Uncertainty of saturated hydraulic conductivity. Min(0), Max(2000)",
              type: {
                selected: "a__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 2000,
                vminV: 0,
                vmaxV: 2000,
                amin: -100,
                amax: 100,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-12",
              pid: "2",
              label: "SOL_ALB(.sol)",
              submodel: "SWAT Execution",
              name: "SOL_ALB",
              desc: "Uncertainty of moist soil albedo. Min(0), Max(0.25)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 0.25,
                vminV: 0,
                vmaxV: 0.25,
                amin: -0.25,
                amax: 0.25,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-13",
              pid: "2",
              label: "GW_REVAP(.gw)",
              submodel: "SWAT Execution",
              name: "GW_REVAP",
              desc: "Uncertainty of groundwater 'revap' coefficient. Min(0.02), Max(0.2)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0.02,
                vmax: 0.2,
                vminV: 0.02,
                vmaxV: 0.2,
                amin: -0.18,
                amax: 0.18,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-14",
              pid: "2",
              label: "GW_DELAY(.gw)",
              submodel: "SWAT Execution",
              name: "GW_DELAY",
              desc: "Uncertainty of groundwater delay (days). Min(0), Max(500)",
              type: {
                selected: "a__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 500,
                vminV: 0,
                vmaxV: 500,
                amin: -100,
                amax: 100,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-15",
              pid: "2",
              label: "REVAPMN(.gw)",
              submodel: "SWAT Execution",
              name: "REVAPMN",
              desc: "Uncertainty of threshold depth of water in the shallow aquifer for 'revap' to occur [mm]. Min(0), Max(500)",
              type: {
                selected: "a__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 500,
                vminV: 0,
                vmaxV: 500,
                amin: -100,
                amax: 100,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-16",
              pid: "2",
              label: "GWQMN(.gw)",
              submodel: "SWAT Execution",
              name: "GWQMN",
              desc: "Uncertainty of threshold depth of water in the shallow aquifer required for return flow to occur [mm]. Min(0), Max(5000)",
              type: {
                selected: "a__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 5000,
                vminV: 0,
                vmaxV: 5000,
                amin: -1000,
                amax: 1000,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-17",
              pid: "2",
              label: "ALPHA_BF(.gw)",
              submodel: "SWAT Execution",
              name: "ALPHA_BF",
              desc: "Uncertainty of baseflow alpha factor [days]. Min(0), Max(1)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 1,
                vminV: 0,
                vmaxV: 1,
                amin: -1,
                amax: 1,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-18",
              pid: "2",
              label: "RCHRG_DP(.gw)",
              submodel: "SWAT Execution",
              name: "RCHRG_DP",
              desc: "Uncertainty of deep aquifer percolation fraction. Min(0), Max(1)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 1,
                vminV: 0,
                vmaxV: 1,
                amin: -1,
                amax: 1,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-19",
              pid: "2",
              label: "CH_K2(.rte)",
              submodel: "SWAT Execution",
              name: "CH_K2",
              desc: "Uncertainty of effective hydraulic conductivity [mm/hr]. Min(-0.01), Max(500)",
              type: {
                selected: "a__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: -0.01,
                vmax: 500,
                vminV: -0.01,
                vmaxV: 500,
                amin: -100,
                amax: 100,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-20",
              pid: "2",
              label: "CH_N2(.rte)",
              submodel: "SWAT Execution",
              name: "CH_N2",
              desc: "Uncertainty of manning's 'n' value for the main channel. Min(-0.01), Max(0.3)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: -0.01,
                vmax: 0.3,
                vminV: -0.01,
                vmaxV: 0.3,
                amin: -0.3,
                amax: 0.3,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-21",
              pid: "2",
              label: "ALPHA_BNK(.rte)",
              submodel: "SWAT Execution",
              name: "ALPHA_BNK",
              desc: "Uncertainty of baseflow alpha factor for bank storage. Min(0), Max(1)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 1,
                vminV: 0,
                vmaxV: 1,
                amin: -1,
                amax: 1,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-22",
              pid: "2",
              label: "SMFMX(.bsn)",
              submodel: "SWAT Execution",
              name: "SMFMX",
              desc: "Uncertainty of maximum melt rate for snow during year (occurs on summer solstice)[mm H2O/degC-day]. Min(0), Max(20)",
              type: {
                selected: "a__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 20,
                vminV: 0,
                vmaxV: 20,
                amin: -10,
                amax: 10,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-23",
              pid: "2",
              label: "SMFMN(.bsn)",
              submodel: "SWAT Execution",
              name: "SMFMN",
              desc: "Uncertainty of minimum melt rate for snow during the year (occurs on winter solstice)[mm H2O/degC-day]. Min(0), Max(20)",
              type: {
                selected: "a__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 20,
                vminV: 0,
                vmaxV: 20,
                amin: -10,
                amax: 10,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-24",
              pid: "2",
              label: "SFTMP(.bsn)",
              submodel: "SWAT Execution",
              name: "SFTMP",
              desc: "Uncertainty of snowfall temperature [OPTINAL]. Min(-20), Max(20)",
              type: {
                selected: "a__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: -20,
                vmax: 20,
                vminV: -20,
                vmaxV: 20,
                amin: -10,
                amax: 10,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-25",
              pid: "2",
              label: "SMTMP(.bsn)",
              submodel: "SWAT Execution",
              name: "SMTMP",
              desc: "Uncertainty of snow melt base temperature. Min(-20), Max(20)",
              type: {
                selected: "a__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: -20,
                vmax: 20,
                vminV: -20,
                vmaxV: 20,
                amin: -10,
                amax: 10,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-26",
              pid: "2",
              label: "TIMP(.bsn)",
              submodel: "SWAT Execution",
              name: "TIMP",
              desc: "Uncertainty of snow pack temperature lag factor. Min(0), Max(1)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 1,
                vminV: 0,
                vmaxV: 1,
                amin: -1,
                amax: 1,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-27",
              pid: "2",
              label: "SURLAG(.bsn)",
              submodel: "SWAT Execution",
              name: "SURLAG",
              desc: "Uncertainty of surface runoff lag time. Min(0.05), Max(24)",
              type: {
                selected: "a__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0.05,
                vmax: 24,
                vminV: 0.05,
                vmaxV: 24,
                amin: -10,
                amax: 10,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-28",
              pid: "2",
              label: "TLAPS(.sub)",
              submodel: "SWAT Execution",
              name: "TLAPS",
              desc: "Uncertainty of temperature lapse rate [degC/km]. Min(-10), Max(10)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: -10,
                vmax: 10,
                vminV: -10,
                vmaxV: 10,
                amin: -10,
                amax: 10,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-29",
              pid: "2",
              label: "CH_K1(.sub)",
              submodel: "SWAT Execution",
              name: "CH_K1",
              desc: "Uncertainty of effective hydraulic conductivity in tributary channel alluvium. Min(0), Max(300)",
              type: {
                selected: "a__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 300,
                vminV: 0,
                vmaxV: 300,
                amin: -100,
                amax: 100,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "2-30",
              pid: "2",
              label: "CH_N1(.sub)",
              submodel: "SWAT Execution",
              name: "CH_N1",
              desc: "Uncertainty of Manning's 'n' value for the tributary channels. Min(0.01), Max(30)",
              type: {
                selected: "a__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0.01,
                vmax: 30,
                vminV: 0.01,
                vmaxV: 30,
                amin: -10,
                amax: 10,
                rmin: 1,
                rmax: 2,
              },
            },
          ],
        },
        {
          id: "3",
          label: "Related to Sediment",
          children: [
            {
              id: "3-1",
              pid: "3",
              label: "USLE_P(.mgt)",
              submodel: "SWAT Execution",
              name: "USLE_P",
              desc:
                "Uncertainty of USLE support practice factor. Min(0), Max(1)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 1,
                vminV: 0,
                vmaxV: 1,
                amin: -1,
                amax: 1,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "3-2",
              pid: "3",
              label: "SPCON(.bsn)",
              submodel: "SWAT Execution",
              name: "SPCON",
              desc:
                "Uncertainty of linear parameter for calculating the maximum amount of sediment that can be reentrained during channel sediment routing. Min(0.001), Max(0.01)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0.001,
                vmax: 0.01,
                vminV: 0.001,
                vmaxV: 0.01,
                amin: -0.01,
                amax: 0.01,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "3-3",
              pid: "3",
              label: "SPEXP(.bsn)",
              submodel: "SWAT Execution",
              name: "SPEXP",
              desc:
                "Uncertainty of exponent parameter for calculating sediment reentrained in channel sediment routing. Min(1), Max(1.5)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 1,
                vmax: 1.5,
                vminV: 1,
                vmaxV: 1.5,
                amin: -0.5,
                amax: 0.5,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "3-4",
              pid: "3",
              label: "CH_COV1(.rte)",
              submodel: "SWAT Execution",
              name: "CH_COV1",
              desc:
                "Uncertainty of channel erodibility factor. Min(-0.05), Max(0.6)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: -0.05,
                vmax: 0.6,
                vminV: -0.05,
                vmaxV: 0.6,
                amin: -0.65,
                amax: 0.65,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "3-5",
              pid: "3",
              label: "CH_COV2(.rte)",
              submodel: "SWAT Execution",
              name: "CH_COV2",
              desc: "Uncertainty of channel cover factor. Min(-0.001), Max(1)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: -0.001,
                vmax: 1,
                vminV: -0.001,
                vmaxV: 1,
                amin: -1,
                amax: 1,
                rmin: 1,
                rmax: 2,
              },
            },
          ],
        },
        {
          id: "4",
          label: "Related to Nutrients",
          children: [
            {
              id: "4-1",
              pid: "4",
              label: "RCN(.bsn)",
              submodel: "SWAT Execution",
              name: "RCN",
              desc: "Uncertainty of concentration of nitrogen in rainfall. Min(0), Max(15)",
              type: {
                selected: "a__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 15,
                vminV: 0,
                vmaxV: 15,
                amin: -5,
                amax: 5,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "4-2",
              pid: "4",
              label: "BIOMIX(.mgt)",
              submodel: "SWAT Execution",
              name: "BIOMIX",
              desc:
                "Uncertainty of biological mixing efficiency. Min(0), Max(1)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 1,
                vminV: 0,
                vmaxV: 1,
                amin: -1,
                amax: 1,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "4-3",
              pid: "4",
              label: "NPERCO(.bsn)",
              submodel: "SWAT Execution",
              name: "NPERCO",
              desc:
                "Uncertainty of nitrogen percolation coefficient. Min(0.01), Max(1)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0.01,
                vmax: 1,
                vminV: 0.01,
                vmaxV: 1,
                amin: -1,
                amax: 1,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "4-4",
              pid: "4",
              label: "PPERCO(.bsn)",
              submodel: "SWAT Execution",
              name: "PPERCO",
              desc: "Uncertainty of phosphorus percolation coefficient. Min(10), Max(17.5)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 10,
                vmax: 17.5,
                vminV: 10,
                vmaxV: 17.5,
                amin: -7.5,
                amax: 7.5,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "4-5",
              pid: "4",
              label: "PHOSKD(.bsn)",
              submodel: "SWAT Execution",
              name: "PHOSKD",
              desc: "Uncertainty of phosphorus percolation coefficient. Min(100), Max(200)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 100,
                vmax: 200,
                vminV: 100,
                vmaxV: 200,
                amin: -100,
                amax: 100,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "4-6",
              pid: "4",
              label: "ERORGN(.hru)",
              submodel: "SWAT Execution",
              name: "ERORGN",
              desc: "Uncertainty of organic N enrichment ratio. Min(0), Max(5)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 5,
                vminV: 0,
                vmaxV: 5,
                amin: -5,
                amax: 5,
                rmin: 1,
                rmax: 2,
              },
            },
            {
              id: "4-7",
              pid: "4",
              label: "ERORGP(.hru)",
              submodel: "SWAT Execution",
              name: "ERORGP",
              desc: "Uncertainty of organic P enrichment ratio. Min(0), Max(5)",
              type: {
                selected: "v__",
                options: [
                  { value: "v__", label: "Replace" },
                  { value: "a__", label: "Add" },
                  { value: "r__", label: "Multiply" },
                ],
                vmin: 0,
                vmax: 5,
                vminV: 0,
                vmaxV: 5,
                amin: -5,
                amax: 5,
                rmin: 1,
                rmax: 2,
              },
            },
          ],
        },
      ],
      toModelParams: [],

      simSetting: {
        saMethod:0,
        simRange: ["2013-01-01", "2013-12-31"],
        simTimes: 66,
        simTargets: ["Flow"],
        timeStep: 0,
        observed: false,
        objective: ["NSE"],
        waterStationShp: "",
        basinTxt: "",
      },
      observedInfo: [
        {
          name: "Flow",
          path: "",
          data: [],
          obj: {},
        },
      ],

      activeStep: 1,
      runningTip: {
        runningNum: 0,
        total: 0,
        percentage: 0,
        remainingTime: {
          hour: 0,
          minute: 0,
          second: 0,
          totalSeconds: 0,
        },
        stop: false,
      },

      paramsSample: [],


      calibrationResult: [],

      totalModify: {},

      scoreSA: {},
      simResult: {},
    };
  },
};
</script>

<style>
body {
  margin: 0%;
  padding: 0%;
}
.OpenGMS-image {
  float: left;
  margin: 12px;
  height: 46px;
}
.OpenGMS-image:hover {
  cursor: pointer;
}
.topMenu {
  font-family: "Times New Roman";
  font-size: 20px;
  padding: 10px 12px;
  color: #fff;
}
.el-container {
  height: -webkit-fill-available;
  background-color: #DBEBD4;
}

.el-header {
  background-color: #000;
  text-align: center;
  line-height: 70px;
  height: 70px !important;
}

.el-aside {
  margin: 2% 0 0 1%;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid #ebeef5;
  background-color: #ffffff;
  height: max-content;
}

.el-main {
  background-color: #DBEBD4;
  padding: 2%;
}
.el-table td,
.el-table th {
  padding: 8px 0;
}
.el-table th {
  font-weight: bold;
}
.el-table .cell {
  word-break: keep-all;
}
.el-dialog__body {
  padding: 20px 20px;
}
.box-card {
  width: 700px;
  margin: auto;
  font-family: "Times New Roman";
}
.paramTable {
  font-family: "Times New Roman";
  width: 95%;
  margin: auto;
}
.paramDialog {
  font-family: "Times New Roman";
}
.save-radio {
  margin-top: 10px;
}
.el-dialog--center .el-dialog__body {
  text-align: center;
  padding: 5px;
}
</style>