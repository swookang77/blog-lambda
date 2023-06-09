import type { AWS } from "@serverless/typescript";

//DynamoDB에서 사용할 테이블을 정의
const PostTable = {
  Type: "AWS::DynamoDB::Table",
  Properties: {
    //테이블 이름은 post
    TableName: "post",
    //title속성을 HASH키로 사용
    KeySchema: [{ AttributeName: "title", KeyType: "HASH" }],
    //title속성은 문자열.
    AttributeDefinitions: [{ AttributeName: "title", AttributeType: "S" }],
    //PAY_PER_REQUEST:요청 단위로 비용 청구
    //PROVISIONED:프로비저닝된 처리량 비용 청구(프로비저닝된 처리량을 예약하여 사용)(ProvisionedThroughput속성으로 지정)(예측 가능한 트래픽인 경우에 사용)
    BillingMode: "PAY_PER_REQUEST",
  },
};

//테이블에 접근하는 권한 정의
const PostTableRoleStatement = {
  Effect: "Allow",
  Action: ["dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:UpdateItem", "dynamodb:DeleteItem"],
  //Fn::GetAtt함수로 테이블의 Arn을 가져옴. 이때 앞서 테이블을 선언한 변수 이름인 PostTable을 사용해야한다.(변수의 이름이 cloudformation으로 전달되어 자원을 지칭하는 키로 사용되기 때문)
  Resource: { "Fn::GetAtt": ["PostTable", "Arn"] },
};

//serverless-dynamodb-local플러그인 관련 설정 .
const dynamodbLocal = {
  stages: ["dev"],
  start: {
    //DynamoDB로컬을 시작할 때 최신 테이블 규격이 반영 됨. 이 옵션을 끄면 sls dynamodb migrate 명령어를 직접 실행.
    migrate: true,
  },
};

const config: AWS = {
  service: "blog-lambda",
  frameworkVersion: "3",
  provider: {
    httpApi:{
      //서버에서 CORS 요청에 대응하기 위해서는 단순 요청과 프리플라이트 요청 모두 대응해야 한다. 
      //이를 구현하려면 HTTP요청을 처리하는 각 함수에 CORS헤더를 적절히 반환하도록 구현하고 프리플라이트 요청을 위한 OPTIONS 요청을 처리하는 함수를 추가해야 한다.
      //API Gateway에서는 다음과 같이 provider.httpApi.cors에 설정을 추가하는 것으로 CORS 요청에 대응할 수 있다. 
      //함수 단위의 CORS 설정이 필요하다면 REST API를 사용하거나 직접 구현해야 함.
      cors:{
        allowedOrigins:[process.env.CORS_ALLOW_ORIGIN!],
        allowedMethods:["GET","POST","PUT","DELETE"],
        allowedHeaders:["Content-Type"],
        //fetch요청에서 쿠키나 Authorization헤더를 보내는 것을 허용.
        allowCredentials:true
      }
    },
    name: "aws",
    runtime: "nodejs14.x",
    stage: "dev",
    region: "ap-northeast-2",
    iam: { role: { statements: [PostTableRoleStatement] } },
  },
  //endpoint설정.
  functions: {
    createPost: {
      handler: "handler.createPost",
      events: [{ httpApi: { path: "/api/post", method: "post" } }],
    },
    readPost: {
      handler: "handler.readPost",
      events: [{ httpApi: { path: "/api/post/{title}", method: "get" } }],
    },
    updatePost: {
      handler: "handler.updatePost",
      events: [{ httpApi: { path: "/api/post/{title}", method: "put" } }],
    },
    deletePost: {
      handler: "handler.deletePost",
      events: [{ httpApi: { path: "/api/post/{title}", method: "delete" } }],
    },
    listPost: {
      handler: "handler.listPost",
      events: [{ httpApi: { path: "/api/post", method: "get" } }],
    },
  },
  
  //서버리스 스택에 DynamoDB를 포함
  resources: {
    Resources: { PostTable },
  },

  plugins: ["serverless-webpack","serverless-dynamodb-local","serverless-offline"],
  
  custom: {
    dynamodb: dynamodbLocal,
  },
};

export = config;
