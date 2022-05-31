<template>
  <div class="introduction">
    <!-- <p class="needCenter title">{{$t('message.introduce')}}</p> -->
    <p class="question1">{{$t('message.q1')}}</p>
    <ol>
      <li>{{$t('message.a1-1')}}</li>
      <li>{{$t('message.a1-2')}}</li>
    </ol>
    <el-divider class="divider"></el-divider>
    <p class="question">{{$t('message.q2')}}</p>
    <ol>
      <p class="needCenter">
        <video  width="70%"  controls >
          <source :src='txtInOut' type="video/mp4">
        </video>
      </p>
    </ol>
    <el-divider class="divider"></el-divider>
    <p class="question">{{$t('message.q3')}}</p>
    <ol>
      <li>{{$t('message.a3-1')}}</li>
      <p class="needCenter">
        <video  width="30%"  controls >
          <source :src='imageData' type="video/mp4">
        </video>
        <video  width="30%"  controls >
          <source :src='meteoData' type="video/mp4">
        </video>
        <video  width="30%"  controls >
          <source :src='observationData' type="video/mp4">
        </video>
      </p>
      <li>{{$t('message.a3-2')}}</li>
      <p class="needCenter">
        <video  width="70%"  controls >
          <source :src='rawData' type="video/mp4">
        </video>
      </p>
    </ol>
    <el-divider class="divider"></el-divider>
    
    <!-- <p class="question">{{$t('message.q4')}}</p>
    <p class="needCenter">
    <video  width="70%"  controls >
      <source :src='demoVideo' type="video/mp4">
    </video>
    </p> -->
    <p>{{$t('message.refer')}}</p>
    <ol>
      <li>Hyeongmo Koo, Min Chen, Anthony J. Jakeman, et al. A global sensitivity analysis approach for identifying critical sources of uncertainty in non-identifiable, spatially distributed environmental models: A holistic analysis applied to SWAT for input datasets and model parameters. 2020, 127</li>
      <p>https://doi.org/10.1016/j.envsoft.2020.104676.</p>
      <li>Hyeongmo Koo, Takuya Iwanaga, Barry F.W. Croke, et al. Position paper: Sensitivity analysis of spatially distributed environmental models- a pragmatic framework for the exploration of uncertainty sources. 2020, 134</li>
      <p>https://doi.org/10.1016/j.envsoft.2020.104857.</p>
    </ol>
    
    <el-divider class="divider"></el-divider>
    <p>{{$t('message.contact')}}</p>
    <ul>
      <li>zhsh191302090@163.com</li>
      <li>chenmin0902@163.com</li>
      <li><a @click="openOpenGMSHome" href="">OpenGMS</a> </li>
      
    </ul>

  </div>
</template>

<script>
const { shell } = require("electron");
export default {
  name: 'welcome',
  data(){
    return{
      demoVideo:'./static/videos/DemoVideo.mp4',
      imageData:'./static/videos/ImageData.mp4',
      meteoData:'./static/videos/MeteoData.mp4',
      observationData:'./static/videos/ObservationData.mp4',
      rawData:'./static/videos/RawData.mp4',
      txtInOut:'./static/videos/TxtInOut.mp4',
    }
  },
  methods:{
    
    openOpenGMSHome() {
      shell.openExternal("http://geomodeling.njnu.edu.cn/home");
    }
  }
}
</script>

<style scoped>
  .introduction{
    width: 50%;
    margin: auto;
    font-family:'Times New Roman';
  }
  .title{
    font-size: 1.5em;
    margin: 0.83em 0;
    font-weight: bold;
  }
  .question1{
    font-size: 1.17em;
    margin: 1em 0;
    font-weight: bold;
  }
  .question{
    text-align: center;
    font-size: 1em;
    /* margin: 1em 0; */
    font-weight: bold;
  }
  .needCenter{
    text-align: center;
    font-family:'Times New Roman';
  }
  ol{
    padding-left: 40px !important;
    list-style-type: decimal !important;
  }
  li{
    margin: 5px !important;
  }
  .divider{
    width: 95%;
    background: grey;
    margin: auto;
  }
  
</style>