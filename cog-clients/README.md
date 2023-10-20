# cog-clients

## Description
Various web mapping clients that use Cloud-Optimised Geotiffs (COG) files or servers.

### esri1.html
ArcGIS Maps SDK for Javascript client which uses a simple [ImageryTileLayer](https://developers.arcgis.com/javascript/latest/api-reference/esri-layers-ImageryTileLayer.html) to directly access the publically available COG file. This does not use TiTiler in between.

### esri2.html
ArcGIS Maps SDK for Javascript client which uses a simple [WebTileLayer](https://developers.arcgis.com/javascript/latest/api-reference/esri-layers-WebTileLayer.html) to access the TiTiler /cog/tiles/{z}/{x}/{y} endpoint running as a Cloud Run service on the Gainforest project.