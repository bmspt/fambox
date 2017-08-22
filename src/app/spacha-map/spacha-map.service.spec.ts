import { TestBed, inject } from '@angular/core/testing';

import { SpachaMapService } from './spacha-map.service';

describe('SpachaMapService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SpachaMapService]
    });
  });

  it('should ...', inject([SpachaMapService], (service: SpachaMapService) => {
    expect(service).toBeTruthy();
  }));
});
