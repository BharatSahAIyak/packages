import { readdirSync, readFileSync, writeFileSync, appendFileSync } from 'fs';
import { z } from 'zod';
import { TransformerClass } from './src/modules/common/transformer.types';
import { TransformerType } from './src/modules/common/transformer.types';

const transformerClassEnum = z.nativeEnum(TransformerClass);
const transformerTypeEnum = z.nativeEnum(TransformerType);

enum ConfigType {
    STRING = 'string',
    JSON = 'json',
    IDE = 'ide',
    NUMBER = 'number',
    BOOLEAN = 'boolean',
}

const transformerSpec = z.object({
    label: z.string(),
    type: transformerTypeEnum,
    class: transformerClassEnum,
    description: z.optional(z.string()),
    version: z.number(),
    outputType: z.enum(['static', 'dynamic']),
    inputs: z.array(z.object({
        label: z.string(),
        name: z.string(),
        type: z.nativeEnum(ConfigType),
        optional: z.boolean(),
        rows: z.optional(z.number()),
    })),
    outputs: z.array(z.object({
        label: z.string(),
        name: z.string(),
    })),
});

const generator = (parent: string) => {
    console.log(`Looking into directory....\n\n${parent}`);
    const configs: Array<Record<string, any>> = [];
    readdirSync(parent, { withFileTypes: true })
    .filter((dir) => dir.isDirectory() && dir.name != 'common')
    .map((transformerClasses) => {
        console.log(`   ${transformerClasses.name}`);
        configs.push(
            ...readdirSync(`${parent}/${transformerClasses.name}`, { withFileTypes: true })
            .filter((dir) => dir.isDirectory())
            .map((transformerType) => {
                console.log(`       ${transformerType.name}`);
                const configFile = `${parent}/${transformerClasses.name}/${transformerType.name}/config.json`;
                try {
                    const configFileContent = readFileSync(configFile, 'utf8');
                    const parsed = JSON.parse(configFileContent);
                    transformerSpec.parse(parsed);
                    return parsed;
                }
                catch (ex: any) {
                    console.error(ex);
                    if (ex.code == 'ENOENT') {
                        throw new Error(`config.json not present or empty at: ${configFile}`);
                    }
                    else if (ex.code == 'ZodError') {
                        throw new Error(`config.json at: ${configFile} does not match transformer spec!`);
                    }
                    else {
                        throw new Error(`config.json at: ${configFile} has malformed JSON!`);
                    }
                }
            })
        );
    });
    configs.sort((t1, t2) => t1.label.localeCompare(t2.label));
    console.log('\nWriting data to registy.json...');
    writeFileSync('registry.json', JSON.stringify(configs, null, 2));
    appendFileSync('registry.json', '\n');
    console.log('Data written successfully to registy.json...');
}

generator('./src/modules');
