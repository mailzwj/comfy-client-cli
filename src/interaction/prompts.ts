/**
 * CLI 交互组件
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import type { Parameter } from '../workflow/types.js';
import { ParameterType } from '../workflow/types.js';

/**
 * 根据值的类型推断参数类型
 */
function inferParameterType(value: any): ParameterType {
  if (typeof value === 'number') return ParameterType.NUMBER;
  if (typeof value === 'boolean') return ParameterType.BOOLEAN;
  return ParameterType.TEXT;
}

// ==================== 交互提示 ====================

export class InteractionPrompts {
  /**
   * 收集工作流注册信息
   */
  async promptWorkflowInfo(
    defaultName: string,
    defaultDescription: string
  ): Promise<{ name: string; description: string }> {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: '请输入工作流名称:',
        default: defaultName,
        validate: (input: string) =>
          input.trim().length > 0 || '名称不能为空',
      },
      {
        type: 'input',
        name: 'description',
        message: '请输入工作流描述（可选）:',
        default: defaultDescription,
      },
    ]);

    return answers as { name: string; description: string };
  }

  /**
   * 收集参数默认值
   */
  async promptParameterDefaults(
    parameters: Parameter[]
  ): Promise<Record<string, any>> {
    const questions = parameters.map((param) =>
      this.createParameterQuestion(param, true)
    );

    const answers = await inquirer.prompt(questions);
    return answers as Record<string, any>;
  }

  /**
   * 收集运行参数
   */
  async promptRunParameters(
    parameters: Parameter[],
    useDefaults: boolean = false
  ): Promise<Record<string, any>> {
    if (useDefaults) {
      const defaults: Record<string, any> = {};
      for (const param of parameters) {
        defaults[param.id] = param.defaultValue;
      }
      return defaults;
    }

    const questions = parameters.map((param) =>
      this.createParameterQuestion(param, false)
    );

    const answers = await inquirer.prompt(questions);
    return answers as Record<string, any>;
  }

  /**
   * 创建工作流选择提示
   */
  async selectWorkflow(workflows: Array<{ name: string; value: string }>): Promise<string> {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'workflowId',
        message: '请选择工作流:',
        choices: workflows,
      },
    ]);

    return answers.workflowId;
  }

  /**
   * 确认操作
   */
  async confirm(message: string, defaultValue = true): Promise<boolean> {
    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message,
        default: defaultValue,
      },
    ]);

    return answers.confirmed;
  }

  /**
   * 自定义参数交互流程：引导用户从工作流中选择任意节点输入作为可配置参数
   */
  async promptCustomParameters(
    workflowJson: Record<string, any>,
    existingParams: Parameter[]
  ): Promise<Parameter[]> {
    // 检查工作流中是否有节点
    const nodeEntries = Object.entries(workflowJson).filter(
      ([_, data]) => data && data.class_type
    );
    if (nodeEntries.length === 0) return [];

    const wantCustom = await this.confirm('是否添加自定义参数?', false);
    if (!wantCustom) return [];

    const customParams: Parameter[] = [];
    let continueAdding = true;

    while (continueAdding) {
      // 选择节点
      const node = await this.promptSelectNode(workflowJson);

      // 选择输入
      const allExisting = [...existingParams, ...customParams];
      const input = await this.promptSelectInput(workflowJson, node.nodeId, allExisting);

      if (input === null) {
        console.log(chalk.yellow('  该节点没有可配置的输入参数'));
        continueAdding = await this.confirm('继续添加自定义参数?', false);
        continue;
      }

      // 收集参数属性
      const props = await this.promptCustomParamProperties(
        node.nodeId,
        input.inputName,
        input.currentValue
      );

      const param: Parameter = {
        id: `custom_${node.nodeId}_${input.inputName}`,
        name: props.name,
        description: props.description || undefined,
        type: props.type,
        nodeId: node.nodeId,
        inputName: input.inputName,
        defaultValue: input.currentValue,
        required: props.required,
      };

      customParams.push(param);
      console.log(chalk.green(`  ✓ 已添加参数: ${param.name} (${node.classType}.${input.inputName})`));

      continueAdding = await this.confirm('继续添加自定义参数?', false);
    }

    return customParams;
  }

  /**
   * 选择工作流节点
   */
  private async promptSelectNode(
    workflowJson: Record<string, any>
  ): Promise<{ nodeId: string; classType: string }> {
    const choices = Object.entries(workflowJson)
      .filter(([_, data]) => data && data.class_type)
      .map(([id, data]) => ({
        name: `[${id}] ${data.class_type}`,
        value: { nodeId: id, classType: data.class_type as string },
      }));

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'node',
        message: '请选择节点:',
        choices,
      },
    ]);

    return answers.node;
  }

  /**
   * 选择节点的输入参数（过滤连线和已有参数）
   */
  private async promptSelectInput(
    workflowJson: Record<string, any>,
    nodeId: string,
    existingParams: Parameter[]
  ): Promise<{ inputName: string; currentValue: any } | null> {
    const inputs = workflowJson[nodeId]?.inputs;
    if (!inputs) return null;

    const existingSet = new Set(
      existingParams
        .filter((p) => p.nodeId === nodeId)
        .map((p) => p.inputName)
    );

    const choices = Object.entries(inputs)
      .filter(([_, value]) => !Array.isArray(value)) // 排除节点连线
      .filter(([name]) => !existingSet.has(name))     // 排除已有参数
      .map(([name, value]) => ({
        name: `${name} = ${JSON.stringify(value).substring(0, 60)}`,
        value: { inputName: name, currentValue: value },
      }));

    if (choices.length === 0) return null;

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'input',
        message: '请选择输入参数:',
        choices,
      },
    ]);

    return answers.input;
  }

  /**
   * 收集自定义参数的属性信息
   */
  private async promptCustomParamProperties(
    nodeId: string,
    inputName: string,
    currentValue: any
  ): Promise<{ name: string; type: ParameterType; description: string; required: boolean }> {
    const inferredType = inferParameterType(currentValue);

    const typeChoices = Object.values(ParameterType).map((t) => ({
      name: t,
      value: t,
    }));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: '参数显示名称:',
        default: inputName,
        validate: (input: string) => input.trim().length > 0 || '名称不能为空',
      },
      {
        type: 'list',
        name: 'type',
        message: '参数类型:',
        choices: typeChoices,
        default: inferredType,
      },
      {
        type: 'input',
        name: 'description',
        message: '参数描述（可选）:',
        default: '',
      },
      {
        type: 'confirm',
        name: 'required',
        message: '是否为必填参数?',
        default: false,
      },
    ]);

    return answers as { name: string; type: ParameterType; description: string; required: boolean };
  }

  /**
   * 创建参数问题的辅助方法
   */
  private createParameterQuestion(
    param: Parameter,
    isSettingDefault: boolean
  ): any {
    const message = isSettingDefault
      ? `请输入 ${param.name} 的默认值:`
      : `${param.name}:`;

    // 提示词类型使用 editor（多行输入）
    if (param.promptType) {
      const prefix = param.promptType === 'positive' ? '✅' : '❌';
      const promptMessage = isSettingDefault
        ? `${prefix} 请输入 ${param.name} 的默认值:`
        : `${prefix} ${param.name}:`;

      return {
        type: 'editor',
        name: param.id,
        message: promptMessage,
        default: param.defaultValue,
        validate: param.required
          ? (input: string) => input.trim().length > 0 || `${param.name} 不能为空`
          : undefined,
      };
    }

    switch (param.type) {
      case ParameterType.SELECT:
        return {
          type: 'list',
          name: param.id,
          message,
          choices: param.options || [],
          default: param.defaultValue,
        };

      case ParameterType.BOOLEAN:
        return {
          type: 'confirm',
          name: param.id,
          message,
          default: param.defaultValue ?? false,
        };

      case ParameterType.NUMBER:
        return {
          type: 'number',
          name: param.id,
          message: `${message} (${param.min ?? '-'} - ${param.max ?? '-' }):`,
          default: param.defaultValue,
          filter: (value: number) => {
            if (isNaN(value)) {
              return param.defaultValue;
            }
            if (param.min !== undefined && value < param.min) {
              return param.min;
            }
            if (param.max !== undefined && value > param.max) {
              return param.max;
            }
            return value;
          },
        };

      case ParameterType.TEXT:
      default:
        const question: any = {
          type: 'input',
          name: param.id,
          message,
          default: param.defaultValue,
        };
        if (param.required) {
          question.validate = (input: string) =>
            input.trim().length > 0 || `${param.name} 不能为空`;
        }
        return question;
    }
  }
}

// 导出单例
export const interactionPrompts = new InteractionPrompts();
