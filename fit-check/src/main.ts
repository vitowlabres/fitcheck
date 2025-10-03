import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

import 'jeep-sqlite/dist/components/jeep-sqlite';
import { defineCustomElements as jeepSqlite } from 'jeep-sqlite/loader';

jeepSqlite(window);


platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
