import prettier from 'prettier/standalone';
import prettierPluginJava from 'prettier-plugin-java';
console.log(prettier.format('class A{}', {parser: 'java', plugins: [prettierPluginJava]}))
