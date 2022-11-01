## AWS Serverless com TypeScript e AWS Cloud Development Kit - Curso Udemy

Repositório criado para armazenar todos os projetos  __AWS Serverless com TypeScript e AWS Cloud Development Kit__ do curso na __Udemy__ com professor __Siecola Code__

_AWS Lambda:_ com ele é possível criar funções em NodeJS e TypeScript para responder a eventos diversos, como requisições HTTP, mensagens de tópicos ou outros eventos, de forma síncrona ou assíncrona. Funções Lambda são a base para a construção de aplicações serverless;

_AWS Cloud Development Kit:_ o AWS CDK é um poderoso framework criado pela própria AWS para o modelamento e provisionamento de recursos na AWS. Com ele é possível criar recursos como funções Lambda, tabelas do DynamoDB ou API Gateway utilizando TypeScript, ao invés de se utilizar templates do CloudFormation. O código em TypeScript ainda pode ser utilizado em pipelines para deployment automatizado;

_REST API com o AWS API Gateway:_ com ele é possível construir APIs de forma descomplicada, se integrando perfeitamente com funções Lambda, além de oferecer validação do corpo das requisições, métodos e parâmetros da API;

_AWS Lambda Layers:_ utilizando-se Lambda Layers, é possível construir funções Lambda reaproveitando e compartilhando código entre as funções;

_AWS SNS:_ o AWS Simple Notification Service é um recurso muito utilizado para criação de mecanismos de notificações para diversas aplicações ou outros serviços;

_AWS SQS:_ o AWS Simple Queue Service é um recurso que permite a criação de filas para entrega de mensagens de forma rápida e confiável, possibilitando a criação de um mecanismo assíncrono de comunicação entre aplicações;

_AWS DynamoDB:_ esse é um poderoso serviço de banco de dados NoSQL, que permite a criação de tabelas, sem a necessidade de se criar um servidor, com características de exclusão automática de dados, escalabilidade e muito mais. Também é uma importante parte na criação de aplicações serverless, juntamente com as funções Lambda;

_AWS S3:_ o AWS Simple Storage Service permite a criação de buckets para armazenamento seguro de arquivos. Além disso é possível configurar eventos a serem gerados quando esses arquivos são colocados nesses buckets, fazendo com outras aplicações sejam avisadas desses eventos;

_WebSocket API com o AWS API Gateway:_ com o AWS API Gateway também é possível construir APIs WebSocket, que permitem a comunicação bi-direcional e assíncrona entre clientes conectados e funções do AWS Lambda, que podem ser invocadas por ações baseadas nas mensagens enviadas pelos clientes. Junto com as funções Lambda, o API Gateway WebSocket se torna uma excelente opção para aplicações serverless que necessitam de conexões persistentes e comunicação assíncrona com seus clientes;

_DynamoDB Stream:_ com essa funcionalidade, as tabelas do AWS DynamoDB podem gerar eventos a serem tratados por funções Lambda, sempre que um item é inserido, alterado ou excluído;

_AWS SES:_ com o AWS Simple Email Service, e-mails podem ser enviados de funções do AWS Lambda de forma fácil;

_AWS EventBridge:_ esse serviço permite a geração e roteamento de eventos de forma mais desacoplada, através da criação de regras baseadas em parâmetros altamente configuráveis;

_AWS IAM:_ com o AWS Identity Access and Management, o acesso a recursos da AWS podem ser controlados com precisão, através da criação de papéis e políticas que são assumidos pelas funções do AWS Lambda;

_AWS X-Ray:_ com esse serviço, a instrumentação de funções Lambda é levada a um nível superior, com a possibilidade de entender o tempo gasto em cada parte da sua execução, além de visualizar o tempo gasto com outros recursos da AWS, como tabelas do AWS DynamoDB e tópicos do AWS SNS;

_AWS CloudWatch Alarms:_ com esse serviço do AWS CloudWatch é possível criar alarmes que agregam logs gerados por funções do AWS Lambda, além de monitorar parâmetros da infraestrutura, como número de mensagens disponíveis em filas do AWS SQS e consumo de tabelas do AWS DynamoDB;

_AWS Cost Explorer:_ com esse serviço é possível obter relatórios e gráficos de consumo dos recursos, divididos por tipo de recurso e tags, que podem identificar aplicações e suas partes. Com ele é possível controlar os custos da sua infraestrutura.

