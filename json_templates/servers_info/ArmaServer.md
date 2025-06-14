## Arma 3 servers `"arma"`: `[]`

- `[]` - list of servers.
    - `"port"`: `int` - port on which the server will be hosted.
    - `"htmlID"`: `string` - server's ID, used in logs, frontend, if object has no `displayName` and communication with backend.
    - `"displayName"`: `string` - name of the server displayed on front.
    - `"filePath"`: `string path` - path to server's executable file.
    - `"startArgs"`: `string[]` - arguments passed when launching the file.
    - `"startingTime"`: `int` - maximum time the server can be starting in minutes. After that time has passed server will be considered offline. Has to be enabled with startServer(`true`).
    - `"cmd"`: `boolean` - whether to use cmd to launch the server.
    - `"debug"`: `boolean` - whether to launch server in debug mode (prints server console).

### Example:

```json
{
  "arma": [
    {
      "port": 2302,
      "htmlID": "antistasi-cherno",
      "displayName": "Antistasi: Chernarus",
      "filePath": "D:\\serwery\\Arma 3 Server\\arma3server_x64.exe",
      "startArgs": [
        "-port=2302 \"-config=D:\\serwery\\Arma 3 Server\\Servers\\_73b70966b0d147249238f961732eea54\\server_config.cfg\" \"-cfg=D:\\serwery\\Arma 3 Server\\Servers\\_73b70966b0d147249238f961732eea54\\server_basic.cfg\" \"-profiles=D:\\serwery\\Arma 3 Server\\Servers\\_73b70966b0d147249238f961732eea54\" -name=_73b70966b0d147249238f961732eea54 \"-mod=@KAT__Advanced_Medical;@RDS_Civilian_Pack;@ITN_Compat_RHS_All_in_One;@CUP_Terrains__Core;@CUP_Terrains__Maps_2_0;@CBA_A3;@ace;@Task_Force_Arrowhead_Radio_BETA__;@Zeus_Enhanced;@ACE3_Arsenal_Extended__Core;@Enhanced_Movement;@Aaren_s_Sound_Core;@BoxLoader__Vehicle_in_Vehicle_loading;@Mavic_3;@Mavic_3_drop_mod;@RHSUSAF;@RHSAFRF;@JSRS_SOUNDMOD;@RHSGREF;@RHSSAF;@RHS_LittlebIrds_2_0_Signature_Key_Fix_;@FRXA_s_TFAR_Extra_Retextured_Equipment;@Sania__Volnorez_EW;@Orlan_UAV;@Orion_UAV;@FPV_Drone_Crocus;@Livonia_Ambience__Chernarus_2020;@Ambient_Animals__Chernarus_2020;@Gorkas_n_Gear;@Simple_Armbands;@Advanced_Towing;@Advanced_Sling_Loading;@JSRS_SOUNDMOD__RHS_USAF_Mod_Pack_Sound_Support;@JSRS_SOUNDMOD__RHS_AFRF_Mod_Pack_Sound_Support;@Simpel_s_Smocks;@No_40mm_Smoke_Bounce;@BackpackOnChest__Redux;@Enhanced_Movement_Rework;@JSRS_SOUNDMOD__RHS_SAF_Mod_Pack_Support;@JSRS_SOUNDMOD__RHS_GREF_Mod_Pack_Sound_Support;@JSRS_SOUNDMOD__Reloading_Sounds;@Additional_Zeus_Things_Zeus_Enhanced__Ares_Achilles_;@ACE3_Arsenal_Extended__Vanilla_and_ACE_;@ACE3_Arsenal_Extended__RHS_All_in_One;@RHS_Helicopters_Sound_Improve;@Zeus_Enhanced__ACE3_Compatibility;@Client_s_FPS_Displayed_for_Zeus;@Achilles;@Simpel_s_Gorkas;@Automatic_Warning_Suppressor;@Russian_Vehicles_But_With_Improved_Textures;@Splendid_Smoke;@TFAR_Animations;@Turret_Enhanced;@TV_Guided_missile_SPIKE_NLOS_;@No_More_Aircraft_Bouncing;@Kamikaze_Drone_FPV_drones_;@Hate_s_Digital_Camera;@Enhanced_Soundscape;@DUI__Squad_Radar;@CH_View_Distance;@Boxloader__ACE_compatability;@ACSTG_AI_Cannot_See_Through_Grass;@ACE_Interaction_Menu_Expansion;@A3_Thermal_Improvement;@ACE_3_Extension_Animations_and_Actions_;@Fawks_Enhanced_NVGs;@Simpel_s_Helmet_Retextures;@Antistasi_Ultimate__Mod;@Sullen_Skies__Chernarus_2020;@Gruppe_Adler_Trenches;@Extra_RHS_Uniform_Re_textures_Reupload_;@ITN__Illuminate_The_Night;@Ladder_Tweak;@Less_Explodey_Aircraft;@Photon_VFX;@Photon_VFX__Smoke;@TCGM_BikeBackpack;@WMO__Walkable_Moving_Objects;@Arma_3_Performance_Extension;@TPNVG__True_Panoramic_Night_Vision;@Reload_Repack_Turret_Magazines;@Reduced_Haze_Mod_v3_1;\" \"-serverMod=@KAT__Advanced_Medical;@RDS_Civilian_Pack;@ITN_Compat_RHS_All_in_One;@CUP_Terrains__Core;@CUP_Terrains__Maps_2_0;@CBA_A3;@ace;@Task_Force_Arrowhead_Radio_BETA__;@Zeus_Enhanced;@ACE3_Arsenal_Extended__Core;@Enhanced_Movement;@Aaren_s_Sound_Core;@BoxLoader__Vehicle_in_Vehicle_loading;@Mavic_3;@Mavic_3_drop_mod;@RHSUSAF;@RHSAFRF;@JSRS_SOUNDMOD;@RHSGREF;@RHSSAF;@RHS_LittlebIrds_2_0_Signature_Key_Fix_;@FRXA_s_TFAR_Extra_Retextured_Equipment;@Sania__Volnorez_EW;@Orlan_UAV;@Orion_UAV;@FPV_Drone_Crocus;@Livonia_Ambience__Chernarus_2020;@Ambient_Animals__Chernarus_2020;@Gorkas_n_Gear;@Simple_Armbands;@Advanced_Towing;@Advanced_Sling_Loading;@Simpel_s_Smocks;@No_40mm_Smoke_Bounce;@BackpackOnChest__Redux;@Enhanced_Movement_Rework;@Additional_Zeus_Things_Zeus_Enhanced__Ares_Achilles_;@ACE3_Arsenal_Extended__Vanilla_and_ACE_;@ACE3_Arsenal_Extended__RHS_All_in_One;@RHS_Helicopters_Sound_Improve;@Zeus_Enhanced__ACE3_Compatibility;@Client_s_FPS_Displayed_for_Zeus;@Achilles;@Simpel_s_Gorkas;@Automatic_Warning_Suppressor;@Russian_Vehicles_But_With_Improved_Textures;@Splendid_Smoke;@TFAR_Animations;@Turret_Enhanced;@TV_Guided_missile_SPIKE_NLOS_;@No_More_Aircraft_Bouncing;@Kamikaze_Drone_FPV_drones_;@Hate_s_Digital_Camera;@DUI__Squad_Radar;@CH_View_Distance;@Boxloader__ACE_compatability;@ACSTG_AI_Cannot_See_Through_Grass;@ACE_Interaction_Menu_Expansion;@A3_Thermal_Improvement;@ACE_3_Extension_Animations_and_Actions_;@Fawks_Enhanced_NVGs;@Simpel_s_Helmet_Retextures;@Antistasi_Ultimate__Mod;@Sullen_Skies__Chernarus_2020;@Gruppe_Adler_Trenches;@Extra_RHS_Uniform_Re_textures_Reupload_;@ITN__Illuminate_The_Night;@Ladder_Tweak;@Less_Explodey_Aircraft;@Photon_VFX;@Photon_VFX__Smoke;@TCGM_BikeBackpack;@WMO__Walkable_Moving_Objects;@Arma_3_Performance_Extension;@TPNVG__True_Panoramic_Night_Vision;@Reload_Repack_Turret_Magazines;@Reduced_Haze_Mod_v3_1;\" -enableHT -maxMem=12288 -cpuCount=8"
      ]
    }
  ]
}
```