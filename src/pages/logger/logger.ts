import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

@Component({
    templateUrl: "logger.html"
})
export class LoggerPage {
    private dismissCallback: () => void;

    constructor(
        private navCtrl: NavController,
        private navParams: NavParams
    ) {
        this.dismissCallback = this.navParams.get('onLoggerDismiss');
    }

    done() {
        this.navCtrl.pop();
    }

}