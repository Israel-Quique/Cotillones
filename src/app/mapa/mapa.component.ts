import { Component, OnInit } from '@angular/core';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import { SidebarComponent } from "../sidebar/sidebar.component";
import { TopbarComponent } from "../topbar/topbar.component";

@Component({
  selector: 'app-mapa',
  imports: [SidebarComponent, TopbarComponent],
  standalone: true,
  templateUrl: './mapa.component.html',
  styleUrl: './mapa.component.css'
})
export class MapaComponent implements OnInit {
  map: Map | undefined;

  ngOnInit(): void {
    const laPazCoords = [-68.1436, -16.5000];
    const projection = 'EPSG:3857';
    this.map = new Map({
      view: new View({
        center: fromLonLat(laPazCoords, projection), // Centrar en La Paz
        zoom: 18,
        projection: projection
      }),
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      target: 'ol-map'
    });
  }
}
