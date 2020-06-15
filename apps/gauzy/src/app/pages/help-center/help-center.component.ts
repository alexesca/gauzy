import { Component, OnInit, OnDestroy } from '@angular/core';
import { TranslationBaseComponent } from '../../@shared/language-base/translation-base.component';
import { TranslateService } from '@ngx-translate/core';
import { AddArticleComponent } from './add-article/add-article.component';
import { Subject } from 'rxjs';
import { NbDialogService } from '@nebular/theme';
import { first } from 'rxjs/operators';

@Component({
	selector: 'ga-help-center',
	templateUrl: './help-center.component.html',
	styleUrls: ['./help-center.component.scss']
})
export class HelpCenterComponent extends TranslationBaseComponent
	implements OnInit, OnDestroy {
	private _ngDestroy$ = new Subject<void>();
	constructor(
		private dialogService: NbDialogService,
		readonly translateService: TranslateService
	) {
		super(translateService);
	}
	ngOnInit() {}
	async addNode() {
		const dialog = this.dialogService.open(AddArticleComponent);
		const chosenIcon = await dialog.onClose.pipe(first()).toPromise();
	}

	ngOnDestroy() {
		this._ngDestroy$.next();
		this._ngDestroy$.complete();
	}
}
