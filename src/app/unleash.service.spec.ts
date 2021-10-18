import {TestBed} from '@angular/core/testing';
import {UnleashService} from './unleash.service';


describe('UnleashService', () => {
  let service: UnleashService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UnleashService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isEnabledAsync()', () => {
    it('should return true', () => {
      service.isEnabledAsync('test_always_true').then(value => {
        expect(value).toBeTrue();
      });
    });
    it('should return false', () => {
      service.isEnabledAsync('test_always_false').then(value => {
        expect(value).toBeFalse();
      });
    });
  });
});
