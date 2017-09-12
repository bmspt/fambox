import { Injectable }   from '@angular/core';
import { Headers, Http, RequestOptions }         from '@angular/http'
import { environment }  from "../../environments/environment"
import { Observable }   from "rxjs/Observable"

@Injectable()
export class EstimateService {
    
    private headers:Headers
    private url:string = 'http://localhost:4000/api/estimate?   '
    // private url:string = 'https://api.uber.com/v1.2/estimates/price?'

    constructor(private http:Http) { 
        // this.headers = new Headers({
        //     'Authorization': 'Token '+ environment.uber.serverToken,
        //     'Accept-Language': 'en_GB',
        //     'Content-Type': 'application/json',
        //     'Access-Control-Allow-Origin': '*'
        // })
    }

    estimate(coordinates:EstimateParams):Observable<Price[]> {
        
        let params:string = `start_latitude=${coordinates.start_latitude}&start_longitude=${coordinates.start_longitude}&end_latitude=${coordinates.end_latitude}&end_longitude=${coordinates.end_longitude}`
        let options = new RequestOptions({headers: this.headers})
        
        return this.http.get(`${this.url}${encodeURIComponent(params)}`)
            .map(res => {
                console.log(res)
                return res.json().prices as [Price]
            })
    }

    private handleError(error:Error): void {
        console.error('An error occured: ', error)
        // Promise.reject(error.message || error)
    }

}


export interface Price {
    localized_display_name: string
    distance: number
    display_name: string
    product_id: string
    high_estimate: number
    low_estimate: number
    duration: number
    estimate: string
    currency_code: string
}

export interface EstimateParams {
    start_latitude:number
    start_longitude:number
    end_latitude:number
    end_longitude:number
    seat_count?:number
}