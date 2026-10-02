import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, Observable } from 'rxjs';
import { Translation } from '@jsverse/transloco';
import { TranslocoHttpLoader } from './transloco-http.loader';

describe('TranslocoHttpLoader', () => {
  it('fetches the dictionary of the requested language', async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const loader = TestBed.inject(TranslocoHttpLoader);
    const http = TestBed.inject(HttpTestingController);

    const result = firstValueFrom(loader.getTranslation('fr') as Observable<Translation>);
    http.expectOne('i18n/fr.json').flush({ hello: 'bonjour' });

    expect(await result).toEqual({ hello: 'bonjour' });
    http.verify();
  });
});
