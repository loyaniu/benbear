import { Component } from '@angular/core';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  home,
  statsChartOutline,
  statsChart,
  addCircleOutline,
  addCircle,
  listOutline,
  list,
  ellipsisHorizontalOutline,
  ellipsisHorizontal,
} from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="home">
          <ion-icon name="home"></ion-icon>
          <ion-label>Home</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="stats">
          <ion-icon name="stats-chart"></ion-icon>
          <ion-label>Stats</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="add">
          <ion-icon name="add-circle"></ion-icon>
          <ion-label>Add</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="transactions">
          <ion-icon name="list"></ion-icon>
          <ion-label>Transactions</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="more">
          <ion-icon name="ellipsis-horizontal"></ion-icon>
          <ion-label>More</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
  styles: [],
})
export class TabsPage {
  constructor() {
    addIcons({
      homeOutline,
      home,
      statsChartOutline,
      statsChart,
      addCircleOutline,
      addCircle,
      listOutline,
      list,
      ellipsisHorizontalOutline,
      ellipsisHorizontal,
    });
  }
}
