import { CommonModule } from '@angular/common';
import { Component, NgZone, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CardEventHandler, CardInitData, CardInitErrorPayload, CardSdk, CardUiProps, CardUser, getKeyFromBlob } from 'dome-embedded-app-sdk';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {

  // The User who is accessing this card
  protected user = signal<CardUser | null>(null);

  // Store the SDK instance to access it later
  protected sdk: CardSdk | null = null;

  // Dome UI Preference
  protected uiPref = signal<CardUiProps | null>(null);

  protected initError = signal<CardInitErrorPayload | null>(null);


  constructor(private ngZone: NgZone) {}


  ngOnInit() {
    // Paste the decryption blob (JSON) from `My Cards` here
    const ngStarterDecBlob = {v: 0, seed: 0, obf: []};

    CardSdk.init(getKeyFromBlob(ngStarterDecBlob), this.eventHandler)
      .then((sdk) => this.sdk = sdk)
      .catch((err) => console.error("Init failed", err))
  }


  // Handle dome card events
  private eventHandler: CardEventHandler = {
    onInit: (data: CardInitData) => {
      const { user, ui } = data;

      // Card SDK callbacks run outside Angular's zone; wrap it in `ngZone.run` to trigger change detection.
      this.ngZone.run(() => {

        user && this.user.set(user);

        if (ui?.theme) {
          // Init data includes the Dome theme "light" | "dark", use this to set the card theme
          this.uiPref.set(ui);
          document.documentElement.setAttribute('data-theme', ui.theme);
        }

      });
    },
    onInitError: (data: CardInitErrorPayload) => {
      this.ngZone.run(() => {
        console.error("Initialization error:", `${data.message} (${data.error_code})`);
        this.initError.set(data);
      });
    },
    onError: (data: {error_code: string | number, message: string}) => {
      console.error("Some error occured", `${data.message} (${data.error_code})`);
    }
  }

}
