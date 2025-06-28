"use client"

import { useEffect, useRef, useState } from "react"

interface GoogleMapProps {
  destination: {
    place_id: string
    name: string
    formatted_address: string
  } | null
  onRouteCleared: () => void
  showMessage: (message: string) => void
}

declare global {
  interface Window {
    google: any
    initMap: () => void
  }
}

export default function GoogleMap({ destination, onRouteCleared, showMessage }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const addressInputRef = useRef<HTMLInputElement>(null)
  const [map, setMap] = useState<any>(null)
  const [directionsService, setDirectionsService] = useState<any>(null)
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [userLocationMarker, setUserLocationMarker] = useState<any>(null)
  const [destinationMarker, setDestinationMarker] = useState<any>(null)
  const [showDirections, setShowDirections] = useState(false)
  const [locationStatus, setLocationStatus] = useState<string>("Carregando mapa...")
  const [showAddressInput, setShowAddressInput] = useState(false)
  const [autocomplete, setAutocomplete] = useState<any>(null)
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null)

  useEffect(() => {
    const initializeMap = () => {
      if (!window.google || !mapRef.current) return

      const directionsServiceInstance = new window.google.maps.DirectionsService()
      const directionsRendererInstance = new window.google.maps.DirectionsRenderer()

      setDirectionsService(directionsServiceInstance)
      setDirectionsRenderer(directionsRendererInstance)

      // Inicia o mapa em São Luís como padrão
      const defaultCenter = { lat: -2.53073, lng: -44.3068 }
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        zoom: 13,
        center: defaultCenter,
        mapTypeControl: true,
        streetViewControl: true,
      })

      directionsRendererInstance.setMap(mapInstance)
      setMap(mapInstance)

      // Tenta obter localização do usuário
      if (navigator.geolocation) {
        setLocationStatus("📍 Solicitando sua localização...")
        showMessage("📍 Permita o acesso à sua localização para rotas mais precisas")

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const exactLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }
            const accuracy = position.coords.accuracy

            setUserLocation(exactLocation)
            setLocationAccuracy(accuracy)
            mapInstance.setCenter(exactLocation)
            mapInstance.setZoom(16)

            // Remove marcador anterior se existir
            if (userLocationMarker) {
              userLocationMarker.setMap(null)
            }

            // Cria marcador na localização do usuário
            const marker = new window.google.maps.Marker({
              position: exactLocation,
              map: mapInstance,
              title: `Sua Localização (±${Math.round(accuracy)}m)`,
              icon: {
                url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                scaledSize: new window.google.maps.Size(40, 40),
              },
            })

            setUserLocationMarker(marker)

            // VERIFICA SE PRECISÃO É MAIOR QUE 50 METROS
            if (accuracy > 50) {
              setLocationStatus(`⚠️ Precisão baixa (±${Math.round(accuracy)}m) - Digite seu endereço`)
              setShowAddressInput(true)
              showMessage(
                `⚠️ Precisão do GPS baixa (±${Math.round(accuracy)}m). Digite seu endereço para melhor precisão.`,
              )
            } else {
              setLocationStatus(`✅ Localização precisa (±${Math.round(accuracy)}m)`)
              setShowAddressInput(false)
              showMessage(`📍 Localização obtida com boa precisão: ±${Math.round(accuracy)}m`)
            }
          },
          (error) => {
            console.error("Erro ao obter geolocalização:", error)
            handleLocationError(error)
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          },
        )
      } else {
        handleLocationError(null, false)
      }
    }

    const handleLocationError = (error: any, browserHasGeolocation = true) => {
      let message = ""
      if (error) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "❌ Localização negada. Digite seu endereço abaixo."
            break
          case error.POSITION_UNAVAILABLE:
            message = "❌ GPS indisponível. Digite seu endereço abaixo."
            break
          case error.TIMEOUT:
            message = "⏱️ Timeout na localização. Digite seu endereço abaixo."
            break
          default:
            message = "❌ Erro na localização. Digite seu endereço abaixo."
        }
      } else if (!browserHasGeolocation) {
        message = "🚫 Geolocalização não suportada. Digite seu endereço abaixo."
      }

      setLocationStatus("📍 Digite seu endereço")
      setShowAddressInput(true)
      showMessage(message)
    }

    // Carrega Google Maps API
    if (!window.google) {
      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCEuKHaxqYCj78yw90FXkwsE3a_ITRqfpA&libraries=places,geometry&callback=initMap`
      script.async = true
      script.defer = true

      window.initMap = initializeMap
      document.head.appendChild(script)
    } else {
      initializeMap()
    }
  }, [])

  // Configura autocomplete quando o input aparece
  useEffect(() => {
    if (showAddressInput && window.google && addressInputRef.current && !autocomplete) {
      const autocompleteInstance = new window.google.maps.places.Autocomplete(addressInputRef.current, {
        types: ["address"],
        componentRestrictions: { country: "BR" },
        fields: ["place_id", "geometry", "name", "formatted_address"],
      })

      autocompleteInstance.addListener("place_changed", () => {
        const place = autocompleteInstance.getPlace()
        if (place.geometry && place.geometry.location) {
          const newLocation = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          }

          setUserLocation(newLocation)
          setLocationAccuracy(10) // Endereço digitado tem boa precisão
          setShowAddressInput(false)

          if (map) {
            map.setCenter(newLocation)
            map.setZoom(16)

            // Remove marcador anterior
            if (userLocationMarker) {
              userLocationMarker.setMap(null)
            }

            // Cria novo marcador
            const marker = new window.google.maps.Marker({
              position: newLocation,
              map: map,
              title: "Seu Endereço",
              icon: {
                url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
                scaledSize: new window.google.maps.Size(40, 40),
              },
            })

            setUserLocationMarker(marker)
          }

          setLocationStatus("✅ Endereço definido com precisão")
          showMessage(`📍 Endereço definido: ${place.formatted_address}`)
        }
      })

      setAutocomplete(autocompleteInstance)
    }
  }, [showAddressInput, map])

  useEffect(() => {
    if (destination && directionsService && directionsRenderer && map && userLocation) {
      calculateAndDisplayRoute()
    }
  }, [destination, directionsService, directionsRenderer, map, userLocation])

  const calculateAndDisplayRoute = () => {
    if (!userLocation || !destination?.place_id || !directionsService || !directionsRenderer) {
      showMessage("❌ Não foi possível calcular rota")
      return
    }

    // Limpa marcador de destino anterior
    if (destinationMarker) {
      destinationMarker.setMap(null)
    }

    showMessage("🗺️ Calculando rota...")

    const request = {
      origin: userLocation,
      destination: { placeId: destination.place_id },
      travelMode: window.google.maps.TravelMode.DRIVING,
    }

    directionsService
      .route(request)
      .then((response: any) => {
        directionsRenderer.setDirections(response)
        setShowDirections(true)

        const route = response.routes[0]
        const leg = route.legs[0]
        const distance = leg.distance.text
        const duration = leg.duration.text

        showMessage(`✅ Rota calculada! Distância: ${distance}, Tempo: ${duration}`)

        // Cria marcador no destino
        const marker = new window.google.maps.Marker({
          position: response.routes[0].legs[0].end_location,
          map,
          title: destination.name,
          icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
            scaledSize: new window.google.maps.Size(40, 40),
          },
        })
        setDestinationMarker(marker)
      })
      .catch((e: any) => {
        console.error("Erro ao calcular rota:", e)
        showMessage("❌ Erro ao calcular rota")
      })
  }

  const clearRoute = () => {
    if (directionsRenderer) {
      directionsRenderer.set("directions", null)
    }
    if (destinationMarker) {
      destinationMarker.setMap(null)
      setDestinationMarker(null)
    }
    setShowDirections(false)
    onRouteCleared()

    if (map && userLocation) {
      map.setCenter(userLocation)
      map.setZoom(16)
    }
    showMessage("🔄 Mapa limpo!")
  }

  const handleManualAddress = () => {
    setShowAddressInput(true)
    showMessage("📍 Digite seu endereço para melhor precisão")
  }

  return (
    <div className="space-y-4">
      {/* Status da Localização */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-blue-700">
              <span className="font-medium">Status:</span> {locationStatus}
            </p>
            {userLocation && locationAccuracy && (
              <p className="text-xs text-blue-600 mt-1">
                📍 Precisão: ±{Math.round(locationAccuracy)}m | Coordenadas: {userLocation.lat.toFixed(6)},{" "}
                {userLocation.lng.toFixed(6)}
              </p>
            )}
          </div>
          {!showAddressInput && locationAccuracy && locationAccuracy <= 50 && (
            <button
              onClick={handleManualAddress}
              className="text-xs bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700"
            >
              📍 Digitar Endereço
            </button>
          )}
        </div>
      </div>

      {/* Modal de Endereço - Aparece no meio da tela quando precisão > 50m */}
      {showAddressInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">📍 Digite seu Endereço</h3>
            <p className="text-sm text-gray-600 mb-4 text-center">
              {locationAccuracy && locationAccuracy > 50
                ? `Precisão do GPS baixa (±${Math.round(locationAccuracy)}m). Digite seu endereço para melhor precisão.`
                : "Digite seu endereço para definir sua localização:"}
            </p>
            <input
              ref={addressInputRef}
              type="text"
              placeholder="Digite seu endereço completo..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="flex justify-end space-x-2 mt-4">
              {userLocation && (
                <button
                  onClick={() => setShowAddressInput(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mapa do Google */}
      <div ref={mapRef} className="h-96 w-full rounded-lg shadow-md" style={{ minHeight: "500px" }} />

      {/* Painel de Direções */}
      {showDirections && (
        <div className="bg-white p-4 rounded-lg shadow-md max-h-96 overflow-y-auto border">
          <h3 className="font-semibold text-gray-700 mb-2">📋 Instruções da Rota</h3>
          <div id="directions-panel" />
        </div>
      )}

      {/* Informações da Rota */}
      {destination && userLocation && (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h4 className="font-semibold text-green-800 mb-2">✅ Rota Calculada</h4>
          <p className="text-sm text-green-700">
            <strong>Destino:</strong> {destination.name}
          </p>
          <p className="text-xs text-green-600 mt-1">{destination.formatted_address}</p>
        </div>
      )}

      {/* Botão de Limpeza */}
      <div className="flex justify-end">
        <button
          onClick={clearRoute}
          className="bg-gray-500 text-white p-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
        >
          🔄 Nova Busca no Mapa
        </button>
      </div>
    </div>
  )
}
