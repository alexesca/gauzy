import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import {
	IDateRange,
	Organization,
	TimeLog,
	Employee,
	PermissionsEnum,
	IManualTimeInput,
	OrganizationPermissionsEnum
} from '@gauzy/models';
import { toUTC } from 'libs/utils';
import { TimesheetService } from '../timesheet.service';
import { NgForm } from '@angular/forms';
import { NbDialogRef, NbDialogService } from '@nebular/theme';
import { Store } from '../../../@core/services/store.service';
import { untilDestroyed } from 'ngx-take-until-destroy';
import { ToastrService } from '../../../@core/services/toastr.service';
import { SelectedEmployee } from '../../../@theme/components/header/selectors/employee/employee.component';
import { EmployeesService } from '../../../@core/services';
import * as moment from 'moment';
import * as _ from 'underscore';
import { DeleteConfirmationComponent } from '../../user/forms/delete-confirmation/delete-confirmation.component';
import { NgxPermissionsService } from 'ngx-permissions';

@Component({
	selector: 'ngx-edit-time-log-modal',
	templateUrl: './edit-time-log-modal.component.html',
	styleUrls: ['./edit-time-log-modal.component.scss']
})
export class EditTimeLogModalComponent implements OnInit, OnDestroy {
	PermissionsEnum = PermissionsEnum;
	OrganizationPermissionsEnum = OrganizationPermissionsEnum;
	today: Date = new Date();
	mode: 'create' | 'update' = 'create';
	loading: boolean;

	addEditRequest: IManualTimeInput = {
		isBillable: true,
		projectId: null,
		taskId: null,
		description: ''
	};
	selectedRange: IDateRange = { start: null, end: null };
	organization: Organization;

	employee: SelectedEmployee;
	employees: Employee[];
	futureDateAllowed: boolean;

	@Input()
	public set timeLog(value: TimeLog | Partial<TimeLog>) {
		this.addEditRequest = _.pick(
			value,
			'id',
			'isBillable',
			'employeeId',
			'projectId',
			'clientId',
			'taskId',
			'description',
			'startedAt',
			'stoppedAt',
			'tags'
		);
		this.selectedRange = {
			start: this.addEditRequest.startedAt,
			end: this.addEditRequest.stoppedAt
		};
		this.mode = value && value.id ? 'update' : 'create';
		if (this.store.selectedEmployee && this.mode === 'create') {
			this.addEditRequest.employeeId = this.store.selectedEmployee.id;
		}
	}

	constructor(
		private timesheetService: TimesheetService,
		private toastrService: ToastrService,
		private dialogService: NbDialogService,
		private ngxPermissionsService: NgxPermissionsService,
		private store: Store,
		private employeesService: EmployeesService,
		private dialogRef: NbDialogRef<EditTimeLogModalComponent>
	) {
		const munutes = moment().get('minutes');
		const roundTime = moment().subtract(munutes - (munutes % 10));
		this.selectedRange = {
			end: roundTime.toDate(),
			start: roundTime.subtract(1, 'hour').toDate()
		};
	}

	ngOnInit() {
		this.store.selectedOrganization$
			.pipe(untilDestroyed(this))
			.subscribe((organization: Organization) => {
				this.organization = organization;
				this.loadEmployees();
			});

		this.ngxPermissionsService.permissions$
			.pipe(untilDestroyed(this))
			.subscribe(async () => {
				this.futureDateAllowed = await this.ngxPermissionsService.hasPermission(
					OrganizationPermissionsEnum.ALLOW_FUTURE_DATE
				);
			});
	}

	close() {
		this.dialogRef.close(null);
	}

	addTime(f: NgForm) {
		if (!f.valid) {
			return;
		}
		const startedAt = toUTC(this.selectedRange.start).toDate();
		const stoppedAt = toUTC(this.selectedRange.end).toDate();

		const addRequestData = {
			startedAt,
			stoppedAt,
			employeeId: this.addEditRequest.employeeId,
			isBillable: this.addEditRequest.isBillable,
			projectId: this.addEditRequest.projectId,
			taskId: this.addEditRequest.taskId,
			description: this.addEditRequest.description
		};
		this.loading = true;
		(this.addEditRequest.id
			? this.timesheetService.updateTime(
					this.addEditRequest.id,
					addRequestData
			  )
			: this.timesheetService.addTime(addRequestData)
		)
			.then((data) => {
				f.resetForm();
				this.dialogRef.close(data);
				this.selectedRange = { start: null, end: null };
				this.toastrService.success('TIMER_TRACKER.ADD_TIME_SUCCESS');
			})
			.catch((error) => {
				this.toastrService.error(error);
			})
			.finally(() => (this.loading = false));
	}

	private async loadEmployees(): Promise<void> {
		const { items = [] } = await this.employeesService.getWorking(
			this.organization.id,
			this.selectedRange.start,
			true
		);
		this.employees = items;
	}

	onDeleteConfirm(log) {
		this.dialogService
			.open(DeleteConfirmationComponent)
			.onClose.pipe(untilDestroyed(this))
			.subscribe((type) => {
				if (type === 'ok') {
					this.timesheetService.deleteLogs(log.id);
				}
			});
	}

	ngOnDestroy(): void {}
}
