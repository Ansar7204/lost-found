import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/** Root component. Everything visible lives in routes (see app.routes.ts). */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App {}
