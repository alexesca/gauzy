import { HelpCenterArticle } from './help-center-article.entity';
import { IHelpCenter, PermissionsEnum } from '@gauzy/models';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
	Controller,
	HttpStatus,
	Post,
	Body,
	UseGuards,
	Get,
	Query
} from '@nestjs/common';
import { CrudController, IPagination } from '../core';
import { AuthGuard } from '@nestjs/passport';
import { Permissions } from '../shared/decorators/permissions';
import { PermissionGuard } from '../shared/guards/auth/permission.guard';
import { ParseJsonPipe } from '../shared';
import { HelpCenterArticleService } from './help-center-article.service';

@ApiTags('knowledge_base_article')
@UseGuards(AuthGuard('jwt'))
@Controller()
export class HelpCenterArticleController extends CrudController<
	HelpCenterArticle
> {
	constructor(private readonly helpCenterService: HelpCenterArticleService) {
		super(helpCenterService);
	}
	@ApiOperation({
		summary: 'Find all menus.'
	})
	@ApiResponse({
		status: HttpStatus.OK,
		description: 'Found tree',
		type: HelpCenterArticle
	})
	@ApiResponse({
		status: HttpStatus.NOT_FOUND,
		description: 'Record not found'
	})
	@Get()
	async findMenu(
		@Query('data', ParseJsonPipe) data: any
	): Promise<IPagination<HelpCenterArticle>> {
		const { relations = [] } = data;
		return this.helpCenterService.findAll({
			relations
		});
	}

	@ApiOperation({
		summary: 'Create new category'
	})
	@ApiResponse({
		status: HttpStatus.CREATED,
		description: 'Success Add category',
		type: HelpCenterArticle
	})
	@UseGuards(PermissionGuard)
	@Permissions(PermissionsEnum.ORG_HELP_CENTER_EDIT)
	@Post()
	async createNode(@Body() entity: IHelpCenter): Promise<any> {
		return this.helpCenterService.create(entity);
	}
}