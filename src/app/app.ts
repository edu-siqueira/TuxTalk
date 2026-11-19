import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { TemaService } from './services/Tema.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class App {
  protected readonly title = signal('TuxTalk');

  // Instancia o serviço já no bootstrap para aplicar data-theme no <html> antes de qualquer tela.
  private readonly temaService = inject(TemaService);
}
