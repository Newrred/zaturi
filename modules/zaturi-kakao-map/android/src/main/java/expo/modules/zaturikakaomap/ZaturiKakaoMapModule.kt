package expo.modules.zaturikakaomap

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ZaturiKakaoMapModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ZaturiKakaoMap")

    View(ZaturiKakaoMapView::class) {
      Events("onMapReady", "onMapError")
      Prop("appKey") { view: ZaturiKakaoMapView, appKey: String? ->
        view.setAppKey(appKey)
      }
      Prop("latitude") { view: ZaturiKakaoMapView, latitude: Double ->
        view.setLatitude(latitude)
      }
      Prop("longitude") { view: ZaturiKakaoMapView, longitude: Double ->
        view.setLongitude(longitude)
      }
      Prop("title") { view: ZaturiKakaoMapView, title: String? ->
        view.setTitle(title)
      }
      Prop("subtitle") { view: ZaturiKakaoMapView, subtitle: String? ->
        view.setSubtitle(subtitle)
      }
      Prop("zoomLevel") { view: ZaturiKakaoMapView, zoomLevel: Int? ->
        view.setZoomLevel(zoomLevel ?: 15)
      }
      OnViewDidUpdateProps { view: ZaturiKakaoMapView ->
        view.startIfReady()
      }
      OnViewDestroys { view: ZaturiKakaoMapView ->
        view.dispose()
      }
    }
  }
}
