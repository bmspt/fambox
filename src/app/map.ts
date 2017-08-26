
import { LngLat } from "mapbox-gl";

export interface IGeometry {
    type:string
    coordinates:number[]
}

export interface IGeoJson {
    type:string
    geometry:IGeometry
    properties?:any
    $key?:string
}

export class GeoJson implements IGeoJson {
    type:string = 'Feature'
    geometry: IGeometry

    constructor(coordinates, public properties?) {
        this.geometry = {
            type: 'Point',
            coordinates: coordinates
        }
    }
}

export class FeatureCollection {
    type:string = 'FeatureCollection'
    constructor(public features: Array<GeoJson>) {}
}

export class Address {
    formattedAddress: string
    street: string
    locality: string
    city: string
    postcode: string
    geocodes: LngLat
}