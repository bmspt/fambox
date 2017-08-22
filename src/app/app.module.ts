import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { SpachaMapComponent } from './spacha-map/spacha-map.component';
import { SpachaMapService } from './spacha-map/spacha-map.service';

// Firebase
import { AngularFireModule }          from "angularfire2";
import { AngularFireDatabaseModule }  from "angularfire2/database";
import { AngularFireAuthModule }      from "angularfire2/auth";

// App ENV
import { environment } from '../environments/environment'


@NgModule({
  declarations: [
    AppComponent,
    SpachaMapComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireDatabaseModule,
    AngularFireAuthModule
  ],
  providers: [SpachaMapService],
  bootstrap: [AppComponent]
})
export class AppModule { }
