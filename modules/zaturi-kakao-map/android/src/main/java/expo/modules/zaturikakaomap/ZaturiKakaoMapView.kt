package expo.modules.zaturikakaomap

import android.content.Context
import android.graphics.Color
import android.view.Gravity
import android.view.View
import android.widget.TextView
import com.kakao.vectormap.KakaoMap
import com.kakao.vectormap.KakaoMapReadyCallback
import com.kakao.vectormap.KakaoMapSdk
import com.kakao.vectormap.LatLng
import com.kakao.vectormap.MapLifeCycleCallback
import com.kakao.vectormap.MapView
import com.kakao.vectormap.camera.CameraUpdateFactory
import com.kakao.vectormap.label.Label
import com.kakao.vectormap.label.LabelOptions
import com.kakao.vectormap.label.LabelStyle
import com.kakao.vectormap.label.LabelStyles
import com.kakao.vectormap.label.LabelTextBuilder
import com.kakao.vectormap.label.LabelTextStyle
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

class ZaturiKakaoMapView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  internal val onMapReady by EventDispatcher<Unit>()
  internal val onMapError by EventDispatcher<Map<String, String>>()

  private val mapView = MapView(context)
  private val messageView = TextView(context)
  private var kakaoMap: KakaoMap? = null
  private var pinLabel: Label? = null
  private var appKey = ""
  private var latitude = 37.5665
  private var longitude = 126.978
  private var title = "Selected place"
  private var subtitle = ""
  private var zoomLevel = 15
  private var startRequested = false
  private var disposed = false

  init {
    addView(mapView, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))

    messageView.apply {
      gravity = Gravity.CENTER
      setBackgroundColor(Color.parseColor("#F4F0E6"))
      setTextColor(Color.parseColor("#3F403A"))
      textSize = 13f
      setPadding(32, 24, 32, 24)
      text = "Kakao Native App Key is required."
    }
    addView(messageView, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
  }

  fun setAppKey(value: String?) {
    appKey = value?.trim().orEmpty()
  }

  fun setLatitude(value: Double) {
    latitude = value
    updateMapContent()
  }

  fun setLongitude(value: Double) {
    longitude = value
    updateMapContent()
  }

  fun setTitle(value: String?) {
    title = value?.takeIf { it.isNotBlank() } ?: "Selected place"
    updateMapContent()
  }

  fun setSubtitle(value: String?) {
    subtitle = value.orEmpty()
    updateMapContent()
  }

  fun setZoomLevel(value: Int) {
    zoomLevel = value.coerceIn(1, 21)
    updateMapContent()
  }

  fun startIfReady() {
    if (disposed || startRequested) {
      return
    }

    if (appKey.isBlank()) {
      failMap("MISSING_APP_KEY", "Kakao Native App Key is required.")
      return
    }

    try {
      if (!KakaoMapSdk.isInitialized()) {
        KakaoMapSdk.init(context.applicationContext, appKey)
      }
      startRequested = true
      mapView.start(
        object : MapLifeCycleCallback() {
          override fun onMapDestroy() {
            kakaoMap = null
            pinLabel = null
          }

          override fun onMapError(error: Exception) {
            startRequested = false
            failMap("MAP_LOAD_ERROR", error.message ?: "Kakao map failed to load.")
          }
        },
        object : KakaoMapReadyCallback() {
          override fun onMapReady(map: KakaoMap) {
            kakaoMap = map
            messageView.visibility = View.GONE
            updateMapContent()
            onMapReady.invoke(Unit)
          }

          override fun getPosition(): LatLng {
            return currentPosition()
          }

          override fun getZoomLevel(): Int {
            return zoomLevel
          }
        }
      )
    } catch (error: Exception) {
      startRequested = false
      failMap("MAP_INIT_ERROR", error.message ?: "Kakao map failed to initialize.")
    }
  }

  fun dispose() {
    disposed = true
    kakaoMap = null
    pinLabel = null
    if (mapView.isStarted) {
      mapView.finish()
    }
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    if (startRequested && mapView.isPaused) {
      mapView.resume()
    }
  }

  override fun onDetachedFromWindow() {
    if (startRequested && mapView.isResumed) {
      mapView.pause()
    }
    super.onDetachedFromWindow()
  }

  private fun currentPosition(): LatLng {
    return LatLng.from(latitude, longitude)
  }

  private fun updateMapContent() {
    val map = kakaoMap ?: return
    val position = currentPosition()
    map.moveCamera(CameraUpdateFactory.newCenterPosition(position, zoomLevel))
    updatePin(map, position)
  }

  private fun updatePin(map: KakaoMap, position: LatLng) {
    val labelManager = map.labelManager ?: return
    val layer = labelManager.layer ?: return
    val styles = labelManager.addLabelStyles(
      LabelStyles.from(
        LabelStyle.from(
          LabelTextStyle.from(18, Color.WHITE, 4, Color.parseColor("#146C5B"))
        ).setPadding(8f)
      )
    )

    pinLabel?.remove()
    val labelText = LabelTextBuilder()
    if (subtitle.isBlank()) {
      labelText.setTexts("PIN: $title")
    } else {
      labelText.setTexts("PIN: $title", subtitle)
    }

    pinLabel = layer.addLabel(
      LabelOptions.from(position)
        .setStyles(styles)
        .setTexts(labelText)
    )
  }

  private fun showMessage(message: String) {
    messageView.text = message
    messageView.visibility = View.VISIBLE
  }

  private fun failMap(code: String, message: String) {
    showMessage("$message\nCheck Kakao Native App Key, Android package, and key hash.")
    onMapError.invoke(
      mapOf(
        "code" to code,
        "message" to message
      )
    )
  }
}
