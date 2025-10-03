import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { DatabaseService } from './services/database.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements AfterViewInit, OnDestroy {
  constructor(private dbService: DatabaseService) {}

  async ngAfterViewInit() {
    await this.dbService.initializeDatabase();
  }

  async ngOnDestroy() {
    await this.dbService.closeDatabase();
  }
}
