CREATE DATABASE restor WITH TEMPLATE = template0 ENCODING = 'UTF8';
ALTER DATABASE restor OWNER TO restor_admin;

\connect restor
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE SCHEMA utils AUTHORIZATION restor_admin;
CREATE OR REPLACE FUNCTION utils.dopa_rest_getschemas()
  RETURNS TABLE(schema character varying, description character varying) AS
$BODY$
SELECT nspname::text "schema", description FROM pg_catalog.pg_namespace, pg_catalog.pg_description where pg_namespace.oid = pg_description.objoid order by 1
  $BODY$
  LANGUAGE sql STABLE
  COST 100
  ROWS 1000;
ALTER FUNCTION utils.dopa_rest_getschemas()
  OWNER TO restor_admin;
COMMENT ON FUNCTION utils.dopa_rest_getschemas() IS 'DOPA REST Service function to return the list of schemas.';
CREATE OR REPLACE FUNCTION utils.dopa_rest_getservices(IN schemaname character varying)
  RETURNS TABLE(service character varying, description character varying) AS
$BODY$
SELECT proname::text service, description FROM pg_catalog.pg_namespace, pg_catalog.pg_proc, pg_description WHERE nspname=$1 AND pg_proc.pronamespace = pg_namespace.oid AND pg_description.objoid=pg_proc.oid ORDER BY 1
  $BODY$
  LANGUAGE sql STABLE
  COST 100
  ROWS 1000;
ALTER FUNCTION utils.dopa_rest_getservices(character varying)
  OWNER TO restor_admin;
CREATE OR REPLACE FUNCTION utils.dopa_rest_getservice(IN servicename character varying)
  RETURNS TABLE(service character varying, description character varying, param_mode character varying, para_name character varying, param_type character varying, param_defs character varying) AS
$BODY$
SELECT routine_name service, description, parameter_mode param_mode, parameter_name param_name, p.data_type para_type, pg_get_function_arguments(pg_proc.oid) param_defs from information_schema.routines r, pg_catalog.pg_proc, information_schema.parameters p, pg_catalog.pg_description d where r.routine_name = $1 and r.specific_name=p.specific_name and d.objoid=pg_proc.oid and pg_proc.proname=$1 order by 3,ordinal_position;
$BODY$
  LANGUAGE sql STABLE
  COST 100
  ROWS 1000;
ALTER FUNCTION utils.dopa_rest_getservice(character varying)
  OWNER TO restor_admin;
COMMENT ON FUNCTION utils.dopa_rest_getservice(character varying) IS 'DOPA REST Service function to return the list of parameters for a service.';
CREATE OR REPLACE FUNCTION utils.dopa_rest_getparams(functionname text)
  RETURNS text AS
'SELECT pg_get_function_identity_arguments(oid) FROM pg_proc where proname=$1;'
  LANGUAGE sql STABLE
  COST 100;
ALTER FUNCTION utils.dopa_rest_getparams(text)
  OWNER TO restor_admin;
COMMENT ON FUNCTION utils.dopa_rest_getparams(text) IS 'DOPA REST Service function to return the list of parameters for a service as a string (optimised for performance).';
CREATE SCHEMA test AUTHORIZATION restor_admin;
COMMENT ON SCHEMA test IS 'Test schema';
CREATE TABLE test.testtable (id_no character varying(50),taxon character varying(254),status character varying(16));
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144529','Caracara cheriway','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('150588','Caracara lutosa','EX');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('150896','Caracara plancus','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144523','Daptrius ater','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144557','Falco alopex','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144563','Falco amurensis','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144552','Falco araea','VU');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144558','Falco ardosiaceus','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144547','Falco berigora','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144576','Falco biarmicus','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('150756','Falco buboisi','EX');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144554','Falco cenchroides','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144578','Falco cherrug','VU');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144561','Falco chicquera','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144567','Falco columbarius','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144565','Falco concolor','NT');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144570','Falco cuvierii','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144583','Falco deiroleucus','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144559','Falco dickinsoni','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144564','Falco eleonorae','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144584','Falco fasciinucha','NT');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144566','Falco femoralis','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144574','Falco hypoleucos','NT');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144577','Falco jugger','NT');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144572','Falco longipennis','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144580','Falco mexicanus','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144553','Falco moluccensis','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144548','Falco naumanni','VU');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144550','Falco newtoni','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144573','Falco novaeseelandiae','NT');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144582','Falco pelegrinoides','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144581','Falco peregrinus','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144551','Falco punctatus','VU');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144568','Falco rufigularis','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144556','Falco rupicoloides','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144579','Falco rusticolus','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144571','Falco severus','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144555','Falco sparverius','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144569','Falco subbuteo','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144575','Falco subniger','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144549','Falco tinnunculus','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144562','Falco vespertinus','NT');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144560','Falco zoniventris','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144532','Herpetotheres cachinnans','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144524','Ibycter americanus','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144538','Micrastur buckleyi','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144535','Micrastur gilvicollis','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('150923','Micrastur mintoni','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144536','Micrastur mirandollei','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144534','Micrastur plumbeus','VU');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144533','Micrastur ruficollis','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144537','Micrastur semitorquatus','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144542','Microhierax caerulescens','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144545','Microhierax erythrogenys','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144543','Microhierax fringillarius','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144544','Microhierax latifrons','NT');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144546','Microhierax melanoleucos','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144530','Milvago chimachima','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144531','Milvago chimango','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144527','Phalcoboenus albogularis','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144528','Phalcoboenus australis','NT');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144525','Phalcoboenus carunculatus','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144526','Phalcoboenus megalopterus','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144541','Polihierax insignis','NT');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144540','Polihierax semitorquatus','LC');
INSERT INTO test.testtable(id_no,taxon,status) VALUES ('144539','Spiziapteryx circumcincta','LC');
CREATE OR REPLACE FUNCTION test.get_species(searchterm text)
  RETURNS TABLE(  id_no character varying(50),
  taxon character varying(254),
  status character varying(16)) AS
$BODY$
select * from test.testtable;
$BODY$
LANGUAGE sql VOLATILE COST 100;
ALTER FUNCTION test.get_species(text) OWNER TO restor_admin;
COMMENT ON FUNCTION test.get_species(text) IS 'Returns species names';
CREATE SCHEMA services AUTHORIZATION restor_admin;
COMMENT ON SCHEMA services IS 'Default schema for publishing REST services';
