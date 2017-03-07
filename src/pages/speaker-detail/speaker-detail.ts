import { Component } from '@angular/core';

import { NavController, NavParams } from 'ionic-angular';


@Component({
  selector: 'page-speaker-detail',
  templateUrl: 'speaker-detail.html'
})
export class SpeakerDetailPage {
  speaker: any;

  constructor(public navCtrl: NavController, public navParams: NavParams) {
    this.speaker = this.navParams.data;
  }

  goToSessionDetail(session: any) {
    this.navCtrl.push('SessionDetailPage', session);
  }
}
